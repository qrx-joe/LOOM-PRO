import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPinia } from 'pinia';
import { useWorkflowStore } from './workflow';
import { createHistoryPlugin } from './plugins/history';

// Mock API（避免真实网络请求）
vi.mock('@/api', () => ({
  workflowApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    execute: vi.fn(),
    listExecutions: vi.fn(),
  },
}));

function createTestPinia() {
  const pinia = createPinia();
  // Pinia 2.x 中需通过 _p 数组注册 plugin
  (pinia as any)._p.push(
    createHistoryPlugin({
      storeId: 'workflow',
      stateKeys: ['nodes', 'edges'],
      maxHistory: 50,
      trackActions: ['addNodes', 'removeNode', 'removeEdge', 'addEdge'],
      debounceActions: { updateNodeData: 500, updateEdgeData: 500 },
    }),
  );
  return pinia;
}

function getStore() {
  return useWorkflowStore(createTestPinia());
}

describe('useWorkflowStore', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============ 基础状态 ============
  describe('初始状态', () => {
    it('应有正确的默认值', () => {
      const store = getStore();
      expect(store.workflowId).toBe('');
      expect(store.workflowName).toBe('未命名工作流');
      expect(store.nodes).toEqual([]);
      expect(store.edges).toEqual([]);
      expect(store.history).toEqual([]);
      expect(store.historyIndex).toBe(-1);
      expect(store._historyCorrupted).toBe(false);
      expect(store._skipNextHistory).toBe(false);
    });
  });

  // ============ initHistory ============
  describe('initHistory', () => {
    it('应从当前 nodes/edges 创建初始历史', () => {
      const store = getStore();
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.edges = [{ id: 'e1', source: 'n1', target: 'n2' }];

      store.initHistory();

      expect(store.history).toHaveLength(1);
      expect(store.historyIndex).toBe(0);
      expect(store.history[0].nodes).toEqual(store.nodes);
      expect(store.history[0].edges).toEqual(store.edges);
      expect(store._historyCorrupted).toBe(false);
    });

    it('深克隆失败时应降级为空历史并标记损坏', () => {
      const store = getStore();
      const circular: any = { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} };
      circular.self = circular; // 节点内部循环引用
      store.nodes = [circular];

      store.initHistory();

      expect(store.history).toEqual([{ nodes: [], edges: [] }]);
      expect(store.historyIndex).toBe(0);
      expect(store._historyCorrupted).toBe(true);
    });
  });

  // ============ saveHistory ============
  describe('saveHistory', () => {
    it('应保存当前状态到历史栈', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];

      const result = store.saveHistory();

      expect(result).toBe(true);
      expect(store.history).toHaveLength(2);
      expect(store.historyIndex).toBe(1);
    });

    it('应截断 redo 分支', () => {
      const store = getStore();
      store.initHistory(); // index=0
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory(); // index=1
      store.nodes = [{ id: 'n2', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory(); // index=2
      store.historyIndex = 1; // 模拟 undo 到 index=1

      store.nodes = [{ id: 'n3', type: 'end', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory(); // 应在 index=1 后截断

      expect(store.history).toHaveLength(3); // 0 + n1 + n3
      expect(store.historyIndex).toBe(2);
    });

    it('应限制历史栈最大长度', () => {
      const store = getStore();
      store.initHistory();
      store.maxHistory = 3;

      for (let i = 0; i < 5; i++) {
        store.nodes = [{ id: `n${i}`, type: 'trigger', position: { x: i, y: 0 }, data: {} }];
        store.saveHistory();
      }

      expect(store.history).toHaveLength(3);
      expect(store.historyIndex).toBe(2);
    });

    it('不可序列化数据时应返回 false 并标记损坏', () => {
      const store = getStore();
      store.initHistory();
      const circular: any = { id: 'bad', type: 'trigger', position: { x: 0, y: 0 }, data: {} };
      circular.self = circular;
      store.nodes = [circular];

      const result = store.saveHistory();

      expect(result).toBe(false);
      expect(store._historyCorrupted).toBe(true);
    });

    it('_skipNextHistory 为 true 时应跳过保存', () => {
      const store = getStore();
      store.initHistory();
      store._skipNextHistory = true;

      const result = store.saveHistory();

      expect(result).toBe(true);
      expect(store.history).toHaveLength(1);
    });
  });

  // ============ undo / redo ============
  describe('undo', () => {
    it('应回退到上一个历史状态', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory();

      const result = store.undo();

      expect(result).not.toBeNull();
      expect(store.historyIndex).toBe(0);
      expect(store.nodes).toEqual([]);
    });

    it('historyIndex <= 0 时应返回 null', () => {
      const store = getStore();
      store.initHistory();

      const result = store.undo();

      expect(result).toBeNull();
    });

    it('_historyCorrupted 为 true 时应返回 null', () => {
      const store = getStore();
      store.initHistory();
      store._historyCorrupted = true;

      const result = store.undo();

      expect(result).toBeNull();
    });
  });

  describe('redo', () => {
    it('应恢复到下一个历史状态', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory();
      store.undo();

      const result = store.redo();

      expect(result).not.toBeNull();
      expect(store.historyIndex).toBe(1);
      expect(store.nodes[0].id).toBe('n1');
    });

    it('historyIndex >= history.length - 1 时应返回 null', () => {
      const store = getStore();
      store.initHistory();

      const result = store.redo();

      expect(result).toBeNull();
    });

    it('_historyCorrupted 为 true 时应返回 null', () => {
      const store = getStore();
      store.initHistory();
      store._historyCorrupted = true;

      const result = store.redo();

      expect(result).toBeNull();
    });
  });

  // ============ getters ============
  describe('getters', () => {
    it('canUndo 应在 historyIndex > 0 且未损坏时为 true', () => {
      const store = getStore();
      store.initHistory();
      expect(store.canUndo).toBe(false);
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory();
      expect(store.canUndo).toBe(true);
      store._historyCorrupted = true;
      expect(store.canUndo).toBe(false);
    });

    it('canRedo 应在 historyIndex < history.length - 1 且未损坏时为 true', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.saveHistory();
      expect(store.canRedo).toBe(false);
      store.undo();
      expect(store.canRedo).toBe(true);
      store._historyCorrupted = true;
      expect(store.canRedo).toBe(false);
    });
  });

  // ============ addNodes ============
  describe('addNodes', () => {
    it('应添加新节点', () => {
      const store = getStore();
      store.initHistory();
      store.addNodes([{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }]);

      expect(store.nodes).toHaveLength(1);
      expect(store.history).toHaveLength(2);
    });

    it('应跳过已存在的节点（幂等性）', () => {
      const store = getStore();
      store.initHistory();
      store.addNodes([{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }]);
      store.addNodes([{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }]);

      expect(store.nodes).toHaveLength(1);
    });

    it('空数组不应触发 saveHistory', () => {
      const store = getStore();
      store.initHistory();
      store.addNodes([]);

      expect(store.history).toHaveLength(1);
    });
  });

  // ============ removeNode ============
  describe('removeNode', () => {
    it('应删除节点及其关联边', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [
        { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'end', position: { x: 0, y: 0 }, data: {} },
      ];
      store.edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
      store.initHistory();

      store.removeNode('n1');

      expect(store.nodes).toHaveLength(1);
      expect(store.edges).toHaveLength(0);
      expect(store.history).toHaveLength(2);
    });

    it('不存在的节点不应触发 saveHistory', () => {
      const store = getStore();
      store.initHistory();
      store.removeNode('nonexistent');

      expect(store.history).toHaveLength(1);
    });
  });

  // ============ addEdge ============
  describe('addEdge', () => {
    it('应添加新边', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [
        { id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'end', position: { x: 0, y: 0 }, data: {} },
      ];
      store.initHistory();

      store.addEdge({ id: 'e1', source: 'n1', target: 'n2', type: 'default' });

      expect(store.edges).toHaveLength(1);
      expect(store.history).toHaveLength(2);
    });

    it('应跳过已存在的边（幂等性）', () => {
      const store = getStore();
      store.initHistory();
      store.addEdge({ id: 'e1', source: 'n1', target: 'n2', type: 'default' });
      store.addEdge({ id: 'e1', source: 'n1', target: 'n2', type: 'default' });

      expect(store.edges).toHaveLength(1);
    });

    it('condition 节点应同步 edge 追踪信息', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [
        { id: 'n1', type: 'condition', position: { x: 0, y: 0 }, data: {} },
        { id: 'n2', type: 'end', position: { x: 0, y: 0 }, data: {} },
        { id: 'n3', type: 'end', position: { x: 0, y: 0 }, data: {} },
      ];
      store.initHistory();

      store.addEdge({ id: 'e1', source: 'n1', target: 'n2', type: 'default', branchType: 'True' });
      store.addEdge({ id: 'e2', source: 'n1', target: 'n3', type: 'default', branchType: 'False' });

      const node = store.nodes.find((n) => n.id === 'n1');
      expect(node?.data?.trueEdgeId).toBe('e1');
      expect(node?.data?.trueTarget).toBe('n2');
      expect(node?.data?.falseEdgeId).toBe('e2');
      expect(node?.data?.falseTarget).toBe('n3');
    });
  });

  // ============ removeEdge ============
  describe('removeEdge', () => {
    it('应删除边', () => {
      const store = getStore();
      store.initHistory();
      store.edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
      store.initHistory();

      store.removeEdge('e1');

      expect(store.edges).toHaveLength(0);
      expect(store.history).toHaveLength(2);
    });

    it('不存在的边不应触发 saveHistory', () => {
      const store = getStore();
      store.initHistory();
      store.removeEdge('nonexistent');

      expect(store.history).toHaveLength(1);
    });
  });

  // ============ updateNodeData ============
  describe('updateNodeData', () => {
    it('应更新节点 data', () => {
      const store = getStore();
      store.initHistory();
      store.nodes = [{ id: 'n1', type: 'llm', position: { x: 0, y: 0 }, data: { model: 'gpt-4' } }];
      store.initHistory();

      store.updateNodeData('n1', { model: 'gpt-3.5' });

      expect(store.nodes[0]?.data?.model).toBe('gpt-3.5');
    });

    it('不存在的节点应静默跳过', () => {
      const store = getStore();
      store.initHistory();
      store.updateNodeData('nonexistent', { foo: 'bar' });

      expect(store.history).toHaveLength(1);
    });

    it('500ms 防抖后应触发 saveHistory', async () => {
      vi.useFakeTimers();
      const store = getStore();
      store.initHistory();
      store.nodes = [{ id: 'n1', type: 'llm', position: { x: 0, y: 0 }, data: { model: 'gpt-4' } }];
      store.initHistory();

      store.updateNodeData('n1', { model: 'gpt-3.5' });
      expect(store.history).toHaveLength(1); // 立即检查：未触发

      vi.advanceTimersByTime(500);
      expect(store.history).toHaveLength(2); // 防抖后触发

      vi.useRealTimers();
    });
  });

  // ============ updateEdgeData ============
  describe('updateEdgeData', () => {
    it('应更新边 data', () => {
      const store = getStore();
      store.initHistory();
      store.edges = [{ id: 'e1', source: 'n1', target: 'n2', type: 'default' }];
      store.initHistory();

      store.updateEdgeData('e1', { label: 'new-label' });

      expect(store.edges[0].label).toBe('new-label');
    });

    it('不存在的边应静默跳过', () => {
      const store = getStore();
      store.initHistory();
      store.updateEdgeData('nonexistent', { foo: 'bar' });

      expect(store.history).toHaveLength(1);
    });

    it('500ms 防抖后应触发 saveHistory', async () => {
      vi.useFakeTimers();
      const store = getStore();
      store.initHistory();
      store.edges = [{ id: 'e1', source: 'n1', target: 'n2', type: 'default' }];
      store.initHistory();

      store.updateEdgeData('e1', { label: 'new-label' });
      expect(store.history).toHaveLength(1);

      vi.advanceTimersByTime(500);
      expect(store.history).toHaveLength(2);

      vi.useRealTimers();
    });
  });

  // ============ clearHistory ============
  describe('clearHistory', () => {
    it('应清空历史并重置损坏标记', () => {
      const store = getStore();
      store.initHistory();
      store._historyCorrupted = true;

      store.clearHistory();

      expect(store.history).toEqual([]);
      expect(store.historyIndex).toBe(-1);
      expect(store._historyCorrupted).toBe(false);
    });
  });

  // ============ setCanvas ============
  describe('setCanvas', () => {
    it('应设置画布数据并重新初始化历史', () => {
      const store = getStore();
      store.nodes = [{ id: 'old', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.initHistory();
      store.saveHistory();

      store.setCanvas(
        [{ id: 'new', type: 'end', position: { x: 10, y: 10 }, data: {} }],
        [{ id: 'e-new', source: 'new', target: 'new' }],
      );

      expect(store.nodes).toHaveLength(1);
      expect(store.nodes[0].id).toBe('new');
      expect(store.history).toHaveLength(1);
      expect(store.historyIndex).toBe(0);
    });
  });

  // ============ loadWorkflow ============
  describe('loadWorkflow', () => {
    it('应加载工作流并重新初始化历史（防止跨工作流历史污染）', async () => {
      const store = getStore();
      const { workflowApi } = await import('@/api');
      (workflowApi.get as any).mockResolvedValue({
        id: 'wf-1',
        name: 'Test Workflow',
        description: 'desc',
        color: '#ff0000',
        status: 'published',
        nodes: [{ id: 'n1', type: 'trigger', position: { x: 0, y: 0 }, data: {} }],
        edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
      });

      store.nodes = [{ id: 'old', type: 'trigger', position: { x: 0, y: 0 }, data: {} }];
      store.initHistory();
      store.saveHistory();

      await store.loadWorkflow('wf-1');

      expect(store.workflowId).toBe('wf-1');
      expect(store.workflowName).toBe('Test Workflow');
      expect(store.nodes[0].id).toBe('n1');
      expect(store.history).toHaveLength(1);
      expect(store.historyIndex).toBe(0);
    });
  });

  // ============ loadTemplate ============
  describe('loadTemplate', () => {
    it('hello-world 模板应加载并初始化历史', () => {
      const store = getStore();
      store.initHistory();
      store.saveHistory();

      store.loadTemplate('hello-world');

      expect(store.nodes.length).toBeGreaterThan(0);
      expect(store.history).toHaveLength(1);
      expect(store.historyIndex).toBe(0);
    });
  });

  // ============ saveWorkflow ============
  describe('saveWorkflow', () => {
    it('成功保存后应重置 _historyCorrupted', async () => {
      const store = getStore();
      const { workflowApi } = await import('@/api');
      (workflowApi.create as any).mockResolvedValue({
        id: 'wf-new',
        status: 'draft',
      });

      store._historyCorrupted = true;
      store.workflowName = 'Test';

      await store.saveWorkflow();

      expect(store.workflowId).toBe('wf-new');
      expect(store._historyCorrupted).toBe(false);
    });
  });

  // ============ addLog / clearLogs ============
  describe('日志', () => {
    it('addLog 应追加日志', () => {
      const store = getStore();
      store.addLog('hello');
      expect(store.executionLogs.length).toBe(1);
      expect(store.executionLogs[0]).toContain('hello');
    });

    it('clearLogs 应清空日志', () => {
      const store = getStore();
      store.addLog('hello');
      store.clearLogs();
      expect(store.executionLogs).toEqual([]);
    });
  });
});
