import { ref, watch } from 'vue';
import { useWorkflowHistory, type HistoryState } from './useWorkflowHistory';
import { useWorkflowStore } from '@/stores/workflow';

/**
 * 工作流画布组合式函数
 * 整合 useWorkflowHistory 和 workflow store，支持 Undo/Redo
 */
export function useWorkflowCanvas() {
  const store = useWorkflowStore();
  const { saveState, undo, redo, canUndo, canRedo, initHistory, clearHistory } = useWorkflowHistory(50);

  const canUndoRef = ref(false);
  const canRedoRef = ref(false);

  // 初始化历史记录
  const initCanvasHistory = () => {
    initHistory(store.nodes, store.edges);
    updateUndoRedoState();
  };

  // 更新 Undo/Redo 可用状态
  const updateUndoRedoState = () => {
    canUndoRef.value = canUndo();
    canRedoRef.value = canRedo();
  };

  // 保存当前状态到历史
  const commitChange = () => {
    saveState(store.nodes, store.edges);
    updateUndoRedoState();
  };

  // 撤销
  const undoChange = (): HistoryState | null => {
    const prev = undo();
    if (prev) {
      store.setCanvas(prev.nodes, prev.edges);
      updateUndoRedoState();
    }
    return prev;
  };

  // 重做
  const redoChange = (): HistoryState | null => {
    const next = redo();
    if (next) {
      store.setCanvas(next.nodes, next.edges);
      updateUndoRedoState();
    }
    return next;
  };

  // 监听 store.nodes 和 store.edges 变化，自动保存历史
  let initialized = false;
  watch(
    [() => store.nodes, () => store.edges],
    () => {
      if (initialized) {
        // 已经有初始状态，再次变化时才保存
        // 但这可能导致频繁保存，需要优化
      }
    },
    { deep: true },
  );

  // 初始化标记
  initialized = true;

  return {
    canUndo: canUndoRef,
    canRedo: canRedoRef,
    initCanvasHistory,
    commitChange,
    undoChange,
    redoChange,
    clearHistory,
  };
}
