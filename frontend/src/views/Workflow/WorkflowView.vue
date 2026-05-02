<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useVueFlow } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import { ElMessage } from 'element-plus';

// Layout Components
import StudioHeader from '@/components/workflow/studio/StudioHeader.vue';
import ComponentLibrary from '@/components/workflow/studio/ComponentLibrary.vue';
import PropertiesPanel from '@/components/workflow/studio/PropertiesPanel.vue';
import DebugPanel from '@/components/workflow/DebugPanel.vue';

// Canvas
import WorkflowCanvasPanel from '@/components/workflow/panels/WorkflowCanvasPanel.vue';

// Logic
import { useWorkflowStore } from '@/stores/workflow';
import { useWorkflowDragDrop } from '@/composables/workflow/useWorkflowDragDrop';
import { useWorkflowEdgeHandlers } from '@/composables/workflow/useWorkflowEdgeHandlers';

// Node Types
import BranchEdge from '@/components/workflow/BranchEdge.vue';
import TriggerNode from '@/components/nodes/TriggerNode.vue';
import LLMNode from '@/components/nodes/LLMNode.vue';
import KnowledgeNode from '@/components/nodes/KnowledgeNode.vue';
import ConditionNode from '@/components/nodes/ConditionNode.vue';
import CodeNode from '@/components/nodes/CodeNode.vue';
import EndNode from '@/components/nodes/EndNode.vue';
import HttpNode from '@/components/nodes/HttpNode.vue';

const route = useRoute();
const workflowStore = useWorkflowStore();

// Load workflow based on route ID
onMounted(async () => {
  const id = route.params.id as string;
  if (id) {
    if (id === 'new') {
      workflowStore.workflowId = '';
      workflowStore.workflowStatus = 'draft';
      workflowStore.loadTemplate('hello-world');
    } else {
      try {
        await workflowStore.loadWorkflow(id);
      } catch (e) {
        console.error('加载工作流失败:', e);
        ElMessage.error('加载工作流失败');
      }
    }
  }
  // 初始化历史记录
  workflowStore.initHistory();
  // 启用 2s 防抖自动保存
  workflowStore.enableAutoSave();
});

// 页面关闭前同步保存
onBeforeUnmount(() => {
  workflowStore.flushAutoSave();
});

// ========== 键盘快捷键 ==========
const handleKeydown = (e: KeyboardEvent) => {
  const ctrl = e.ctrlKey || e.metaKey;

  // Ctrl+S: 保存
  if (ctrl && e.key === 's') {
    e.preventDefault();
    handleSave();
    return;
  }

  // Ctrl+Z: 撤销
  if (ctrl && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    workflowStore.undo();
    return;
  }

  // Ctrl+Y / Ctrl+Shift+Z: 重做
  if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault();
    workflowStore.redo();
    return;
  }

  // Delete / Backspace: 删除选中节点/边
  if (e.key === 'Delete' || e.key === 'Backspace') {
    // 忽略聚焦在 input/textarea 中的删除
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (selectedNodeId.value) {
      handleDeleteNode(selectedNodeId.value);
    } else if (selectedEdgeId.value) {
      handleDeleteEdge(selectedEdgeId.value);
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// 监听节点和边的变化，自动保存历史
// 注意：自动保存历史可能导致过于频繁的状态保存，暂时注释掉
// 如果需要自动保存，可以取消注释并优化
// workflowStore.$subscribe(
//   (mutation, state) => {
//     if (mutation.type === 'direct' && (state.nodes || state.edges)) {
//       commitChange();
//     }
//   },
//   { detached: false }
// );
const FLOW_ID = 'workflow-canvas';
const vueFlow = useVueFlow(FLOW_ID);
const { onConnect, project } = vueFlow;

// Node & Edge Types
const nodeTypes = {
  trigger: TriggerNode,
  llm: LLMNode,
  knowledge: KnowledgeNode,
  condition: ConditionNode,
  code: CodeNode,
  end: EndNode,
  http: HttpNode,
};
const edgeTypes = {
  branch: BranchEdge,
};

// Add nodes directly to store (synced with VueFlow via v-model)
const addNodesToStore = (nodes: any[]) => {
  workflowStore.addNodes(nodes);
};

// Logic Hooks
const { handleConnect } = useWorkflowEdgeHandlers(workflowStore);
onConnect(handleConnect);
const { onDragOver, onDrop } = useWorkflowDragDrop(project, addNodesToStore);

// Selection State
const selectedNodeId = ref('');
const selectedEdgeId = ref('');
const selectedNode = computed(() => {
  return workflowStore.nodes.find((n) => n.id === selectedNodeId.value);
});
const selectedEdge = computed(() => {
  return workflowStore.edges.find((e) => e.id === selectedEdgeId.value);
});

// Event Handlers
const onNodeClick = (node: any) => {
  selectedNodeId.value = node.id;
  selectedEdgeId.value = ''; // 清除边选择
};

const onEdgeClick = (edge: any) => {
  selectedEdgeId.value = edge.id;
  selectedNodeId.value = ''; // 清除节点选择
};

const onPaneClick = () => {
  selectedNodeId.value = '';
  selectedEdgeId.value = '';
};

const handleUpdateNode = (id: string, data: any) => {
  workflowStore.updateNodeData(id, data);
};

const handleDeleteNode = (id: string) => {
  workflowStore.removeNode(id);
  selectedNodeId.value = '';
};

const handleUpdateEdge = (id: string, data: any) => {
  workflowStore.updateEdgeData(id, data);
};

const handleDeleteEdge = (id: string) => {
  workflowStore.removeEdge(id);
  selectedEdgeId.value = '';
};

const handleRun = async (input?: string) => {
  workflowStore.executing = true;
  try {
    // 如果没有保存过，先自动保存
    if (!workflowStore.workflowId) {
      await workflowStore.saveWorkflow();
      ElMessage.info('已自动保存工作流');
    }
    await workflowStore.executeWorkflow(input ?? 'Test Input');
    ElMessage.success('执行完成');
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '执行失败';
    ElMessage.error(msg);
    console.error('[Workflow Execute]', e);
  } finally {
    workflowStore.executing = false;
  }
};

const handlePublish = async () => {
  try {
    await workflowStore.publishWorkflow();
    ElMessage.success('应用已发布');
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '发布失败';
    ElMessage.error(msg);
  }
};

const handleSave = async () => {
  try {
    await workflowStore.saveWorkflow();
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '保存失败';
    ElMessage.error(msg);
  }
};

// Replay logic (simplified for layout demo, restore full logic later if needed)
const replaying = ref(false);

// 调试面板
const debugPanelVisible = ref(false);

const handleShowDebug = () => {
  debugPanelVisible.value = true;
};

const handleDebugRun = async (testData: any) => {
  console.log('[Debug] Running with test data:', testData);
  const input = testData?.input ?? 'Test Input';
  await handleRun(input);
};

// StudioHeader 引用，用于同步保存状态
const studioHeaderRef = ref<{ setSaving: (v: boolean) => void; setLastSavedAt: (d: Date) => void } | null>(null);

// 监听 store saving 状态，同步到 Header
watch(
  () => workflowStore.saving,
  (val) => studioHeaderRef.value?.setSaving(val),
);

// 监听最后保存时间，同步到 Header
watch(
  () => workflowStore.getLastAutoSaveAt(),
  (val) => { if (val) studioHeaderRef.value?.setLastSavedAt(val); },
);
</script>

<template>
  <div class="studio-layout">
    <StudioHeader
      ref="studioHeaderRef"
      :workflow-name="workflowStore.workflowName"
      :workflow-description="workflowStore.workflowDescription"
      :workflow-color="workflowStore.workflowColor"
      :auto-save="true"
      @run="handleShowDebug"
      @publish="handlePublish"
      @save="handleSave"
      @update:workflow-name="workflowStore.workflowName = $event"
      @update:workflow-description="workflowStore.workflowDescription = $event"
      @update:workflow-color="workflowStore.workflowColor = $event"
    />

    <div class="studio-body">
      <!-- Left: Component Library -->
      <aside class="studio-left">
        <ComponentLibrary @drag-start="() => {}" />
        <!-- Note: drag-start handles dataTransfer internally in ComponentLibrary, 
             but we need to ensure local onDragStart matches useWorkflowDragDrop expectations if tailored. 
             Actually ComponentLibrary sets dataTransfer, and onDrop reads it. 
        -->
      </aside>

      <!-- Center: Canvas -->
      <main class="studio-center">
        <!-- We reuse WorkflowCanvasPanel for the VueFlow wrapper,
             but we might need to hide its internal Toolbar since we moved actions to Header
        -->
        <div class="canvas-wrapper">
          <WorkflowCanvasPanel
            v-model:nodes="workflowStore.nodes"
            v-model:edges="workflowStore.edges"
            :flow-id="FLOW_ID"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            :saving="false"
            :executing="workflowStore.executing"
            :replaying="replaying"
            :replay-speed="1000"
            :replay-progress="0"
            :replay-total="0"
            :preserve-trail="false"
            :compare-last="false"
            :snapshot-options="[]"
            :selected-snapshot-id="''"
            :apply-snapshot-meta="false"
            :can-undo="workflowStore.canUndo"
            :can-redo="workflowStore.canRedo"
            :on-drag-over="onDragOver"
            :on-drop="onDrop"
            @node-click="onNodeClick"
            @edge-click="onEdgeClick"
            @pane-click="onPaneClick"
            @undo="workflowStore.undo"
            @redo="workflowStore.redo"
          />
          <!-- Note: WorkflowCanvasPanel currently has a Toolbar inside. 
                  In Phase 2 we should strip it or make it hideable via props. 
                  For now we live with duplicate controls or ignore it. 
             -->
        </div>

        <!-- Bottom: Optional Output Panel -->
        <!-- <div class="studio-bottom"></div> -->
      </main>

      <!-- Right: Properties -->
      <aside class="studio-right">
        <PropertiesPanel
          :node="selectedNode"
          :edge="selectedEdge"
          @update="handleUpdateNode"
          @delete="handleDeleteNode"
          @update-edge="handleUpdateEdge"
          @delete-edge="handleDeleteEdge"
        />
      </aside>
    </div>

    <!-- 调试面板 -->
    <DebugPanel v-model:visible="debugPanelVisible" @run="handleDebugRun" />
  </div>
</template>

<style scoped>
.studio-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: var(--color-border-light);
  overflow: hidden;
}

.studio-body {
  height: calc(100vh - 64px); /* Subtract header height */
  display: flex;
  overflow: hidden;
  gap: 0;
  margin-top: 64px; /* Space for the fixed header */
}

.studio-left {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  z-index: 20;
}

.studio-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  background: var(--color-border-light);
}

.canvas-wrapper {
  flex: 1;
  background: var(--color-border-light);
  position: relative;
  overflow: hidden;
}

.studio-right {
  width: 360px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  z-index: 20;
}

/* 滚动条样式优化 */
.studio-left::-webkit-scrollbar,
.studio-right::-webkit-scrollbar {
  width: 6px;
}

.studio-left::-webkit-scrollbar-thumb,
.studio-right::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.studio-left::-webkit-scrollbar-thumb:hover,
.studio-right::-webkit-scrollbar-thumb:hover {
  background: var(--color-medium);
}

.studio-left::-webkit-scrollbar-track,
.studio-right::-webkit-scrollbar-track {
  background: transparent;
}
</style>

<!-- Redundant global styles removed: StudioHeader handles its own fixed positioning -->
