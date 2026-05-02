export interface FieldOption {
  label: string;
  value: string | number | boolean;
}

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'slider';

export interface NodeField {
  key: string;
  label: string;
  type: FieldType;
  defaultValue?: any;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  placeholder?: string;
  // 条件显示：接收当前节点 data，返回 true 时渲染
  visibleWhen?: (data: Record<string, any>) => boolean;
}

export interface NodeTypeConfig {
  fields: NodeField[];
  tips?: Array<{ type: 'info' | 'success' | 'warning'; content: string }>;
}

// 模型选项
const MODEL_OPTIONS: FieldOption[] = [
  { label: 'DeepSeek Chat', value: 'deepseek-chat' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
  { label: 'GPT-4', value: 'gpt-4' },
];

// HTTP 方法选项
const HTTP_METHOD_OPTIONS: FieldOption[] = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
];

// 分块策略选项
const STRATEGY_OPTIONS: FieldOption[] = [
  { label: '递归（中文优先）', value: 'recursive' },
  { label: '语义（按段落）', value: 'semantic' },
  { label: '固定长度', value: 'fixed' },
];

export const NODE_TYPE_CONFIGS: Record<string, NodeTypeConfig> = {
  llm: {
    fields: [
      { key: 'model', label: '模型选择', type: 'select', defaultValue: 'deepseek-chat', options: MODEL_OPTIONS },
      { key: 'systemPrompt', label: '系统提示词', type: 'textarea', defaultValue: '', rows: 4, placeholder: '你是一个专业的AI助手...' },
      { key: 'temperature', label: '温度 (Temperature)', type: 'slider', defaultValue: 0.7, min: 0, max: 2, step: 0.1 },
    ],
  },

  knowledge: {
    fields: [
      { key: 'dataset', label: '知识库', type: 'select', defaultValue: '' },
      { key: 'topK', label: '召回数量 (TopK)', type: 'number', defaultValue: 3, min: 1, max: 10 },
      { key: 'scoreThreshold', label: '相似度阈值', type: 'slider', defaultValue: 0.7, min: 0, max: 1, step: 0.05 },
      { key: 'hybrid', label: '混合检索', type: 'switch', defaultValue: false },
      { key: 'rerank', label: '重排序', type: 'switch', defaultValue: false },
      { key: 'strategy', label: '分块策略', type: 'select', defaultValue: 'recursive', options: STRATEGY_OPTIONS },
    ],
  },

  condition: {
    fields: [
      { key: 'expression', label: '判断条件', type: 'textarea', defaultValue: '', rows: 3, placeholder: '例如: input.includes("error")' },
    ],
    tips: [{ type: 'info', content: '支持 JavaScript 表达式，返回 true/false。连线点击可切换 True/False 分支。' }],
  },

  code: {
    fields: [
      { key: 'code', label: '代码逻辑', type: 'textarea', defaultValue: '', rows: 8, placeholder: '// JavaScript 代码\nreturn { result: "ok" }' },
    ],
  },

  end: {
    fields: [
      { key: 'outputVar', label: '输出变量名', type: 'text', defaultValue: 'result', placeholder: 'result' },
    ],
  },

  http: {
    fields: [
      { key: 'method', label: '请求方法', type: 'select', defaultValue: 'GET', options: HTTP_METHOD_OPTIONS },
      { key: 'url', label: '请求 URL', type: 'text', defaultValue: '', placeholder: 'https://api.example.com/endpoint' },
      { key: 'headers', label: '请求头 (Headers)', type: 'textarea', defaultValue: '', rows: 3, placeholder: '{"Content-Type": "application/json"}' },
      { key: 'body', label: '请求体 (Body)', type: 'textarea', defaultValue: '', rows: 4, placeholder: '{"key": "value"}', visibleWhen: (d) => d.method !== 'GET' },
      { key: 'timeoutMs', label: '超时时间 (ms)', type: 'number', defaultValue: 30000, min: 1000, max: 300000, step: 1000 },
    ],
  },

  trigger: {
    fields: [],
    tips: [{ type: 'success', content: '工作流的起始节点，接收外部输入。' }],
  },
};
