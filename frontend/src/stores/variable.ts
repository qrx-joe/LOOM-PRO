import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Variable } from '@/types';

/**
 * 工作流变量系统
 *
 * 职责：
 * - 管理工作流中的所有变量（输入、节点输出、系统变量、常量）
 * - 提供变量引用解析（模板字符串 {{var}} → 实际值）
 * - 在工作流执行前从 nodes/edges 中自动收集可用变量
 * - 提供变量选择器数据（给 VariableMapper 组件用）
 */

export const useVariableStore = defineStore('variable', () => {
  // ---------- 状态 ----------

  /** 工作流 ID，用于请求后端变量列表（预留） */
  const workflowId = ref('');

  /** 当前工作流中的所有变量 */
  const variables = ref<Variable[]>([]);

  /** 加载状态 */
  const loading = ref(false);

  // ---------- Getters ----------

  /** 获取所有输入变量 */
  const inputVariables = computed(() =>
    variables.value.filter((v) => v.source === 'input'),
  );

  /** 获取所有节点输出变量 */
  const nodeVariables = computed(() =>
    variables.value.filter((v) => v.source === 'node'),
  );

  /** 获取所有系统变量 */
  const systemVariables = computed(() =>
    variables.value.filter((v) => v.source === 'system'),
  );

  /** 获取所有常量 */
  const constantVariables = computed(() =>
    variables.value.filter((v) => v.source === 'constant'),
  );

  /** 根据 fieldKey 查找已绑定的变量引用 */
  function getBinding(fieldKey: string): string | undefined {
    const binding = variables.value.find(
      (v) => v.source === 'constant' && v.id.startsWith(`binding-${fieldKey}`),
    );
    return binding?.defaultValue as string | undefined;
  }

  // ---------- Actions ----------

  /** 从工作流节点中自动收集可用变量 */
  function collectFromNodes(nodes: Array<{ id: string; type: string; data?: Record<string, any> }>) {
    const collected: Variable[] = [];

    // 输入变量：trigger 节点的 input
    const trigger = nodes.find((n) => n.type === 'trigger');
    if (trigger) {
      collected.push({
        id: 'input',
        name: '用户输入',
        type: 'string',
        source: 'input',
        description: '工作流外部输入',
      });
    }

    // 系统变量
    collected.push(
      {
        id: 'system.timestamp',
        name: '当前时间戳',
        type: 'number',
        source: 'system',
        description: '当前 Unix 时间戳（毫秒）',
      },
      {
        id: 'system.now',
        name: '当前时间',
        type: 'string',
        source: 'system',
        description: '当前时间（ISO 字符串）',
      },
    );

    // 节点输出变量
    for (const node of nodes) {
      if (node.type === 'trigger') continue;

      const varName = `${node.id}`;
      const label = node.data?.label || node.id;

      switch (node.type) {
        case 'llm':
          collected.push({
            id: `node-${varName}`,
            name: `${label} (LLM)`,
            type: 'string',
            source: 'node',
            nodeId: node.id,
            path: node.id,
            description: `大模型回复内容`,
          });
          break;
        case 'knowledge':
          collected.push({
            id: `node-${varName}`,
            name: `${label} (知识检索)`,
            type: 'array',
            source: 'node',
            nodeId: node.id,
            path: node.id,
            description: `检索结果列表`,
          });
          break;
        case 'http':
          collected.push({
            id: `node-${varName}`,
            name: `${label} (HTTP)`,
            type: 'object',
            source: 'node',
            nodeId: node.id,
            path: node.id,
            description: `HTTP 响应结果`,
          });
          break;
        case 'code':
          collected.push({
            id: `node-${varName}`,
            name: `${label} (代码)`,
            type: 'object',
            source: 'node',
            nodeId: node.id,
            path: node.id,
            description: `代码执行结果`,
          });
          break;
        case 'condition':
          collected.push({
            id: `node-${varName}`,
            name: `${label} (条件)`,
            type: 'boolean',
            source: 'node',
            nodeId: node.id,
            path: node.id,
            description: `条件判断结果`,
          });
          break;
      }
    }

    variables.value = collected;
  }

  /**
   * 解析模板字符串中的变量引用
   * 示例：'你好，{{input}}，结果是 {{node-1}}' + { input: '张三', 'node-1': '成功' }
   * 返回：'你好，张三，结果是 成功'
   */
  function resolveTemplate(template: string, context: Record<string, any>): string {
    if (!template || typeof template !== 'string') {
      return template;
    }
    return template.replace(/\{\{([\w.\[\]]+)\}\}/g, (match, key) => {
      const value = resolveVariable(key, context);
      if (value === undefined || value === null) {
        return match; // 找不到时保留原样
      }
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    });
  }

  /**
   * 解析单个变量引用
   * 支持嵌套路径：node-1.output.results[0].name
   */
  function resolveVariable(key: string, context: Record<string, any>): any {
    // 完整 key 匹配
    if (key in context) {
      return context[key];
    }

    // 路径解析
    try {
      const parts = key.split('.');
      let current: any = context;
      for (const part of parts) {
        const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
        if (arrayMatch) {
          const arr = current[arrayMatch[1]];
          if (!Array.isArray(arr)) return undefined;
          current = arr[parseInt(arrayMatch[2], 10)];
        } else {
          current = current[part];
        }
        if (current === undefined || current === null) {
          return undefined;
        }
      }
      return current;
    } catch {
      return undefined;
    }
  }

  /** 添加/更新字段绑定（constant 类型，用于属性面板变量选择器） */
  function setFieldBinding(fieldKey: string, variableRef: string | undefined) {
    const existingIdx = variables.value.findIndex(
      (v) => v.id === `binding-${fieldKey}`,
    );
    if (variableRef === undefined || variableRef === '') {
      // 清除绑定
      if (existingIdx !== -1) {
        variables.value.splice(existingIdx, 1);
      }
    } else {
      const binding: Variable = {
        id: `binding-${fieldKey}`,
        name: fieldKey,
        type: 'string',
        source: 'constant',
        defaultValue: variableRef,
        description: `字段 ${fieldKey} 的变量绑定`,
      };
      if (existingIdx !== -1) {
        variables.value.splice(existingIdx, 1, binding);
      } else {
        variables.value.push(binding);
      }
    }
  }

  /** 清空所有变量 */
  function clearVariables() {
    variables.value = [];
  }

  /** 重置 store */
  function $reset() {
    variables.value = [];
    workflowId.value = '';
    loading.value = false;
  }

  return {
    workflowId,
    variables,
    loading,
    inputVariables,
    nodeVariables,
    systemVariables,
    constantVariables,
    getBinding,
    collectFromNodes,
    resolveTemplate,
    resolveVariable,
    setFieldBinding,
    clearVariables,
    $reset,
  };
});
