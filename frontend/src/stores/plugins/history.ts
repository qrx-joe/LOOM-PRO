import type { PiniaPluginContext } from 'pinia';

export interface HistorySnapshot {
  [key: string]: any;
}

export interface HistoryPluginOptions {
  /** 目标 store 的 ID */
  storeId: string;
  /** 需要追踪的 state key 列表 */
  stateKeys: string[];
  /** 历史栈最大长度（默认 50） */
  maxHistory?: number;
  /** 这些 action 执行后自动保存历史 */
  trackActions?: string[];
  /** 这些 action 执行后防抖保存历史（毫秒） */
  debounceActions?: Record<string, number>;
}

declare module 'pinia' {
  export interface PiniaCustomProperties<
    S extends StateTree = StateTree,
    G = _GettersTree<S>,
    A = _ActionsTree,
  > {
    /** 初始化历史记录 */
    $historyInit: () => void;
    /** 保存当前状态到历史栈 */
    $historySave: () => boolean;
    /** 撤销 */
    $historyUndo: () => HistorySnapshot | null;
    /** 重做 */
    $historyRedo: () => HistorySnapshot | null;
    /** 清空历史 */
    $historyClear: () => void;
  }
}

export function createHistoryPlugin(options: HistoryPluginOptions) {
  return ({ store }: PiniaPluginContext) => {
    if (store.$id !== options.storeId) return;

    const stateKeys = options.stateKeys;
    const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

    const getMaxHistory = (storeInstance: any) =>
      (storeInstance.maxHistory as number) ?? options.maxHistory ?? 50;

    // 深克隆辅助
    const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

    store.$historyInit = function () {
      try {
        const snapshot: HistorySnapshot = {};
        for (const key of stateKeys) {
          snapshot[key] = deepClone(this[key]);
        }
        this.history = [snapshot];
        this.historyIndex = 0;
        this._historyCorrupted = false;
      } catch (e) {
        console.error('[History] Failed to initialize history:', e);
        const fallback: HistorySnapshot = {};
        for (const key of stateKeys) {
          fallback[key] = Array.isArray(this[key]) ? [] : {};
        }
        this.history = [fallback];
        this.historyIndex = 0;
        this._historyCorrupted = true;
      }
    };

    store.$historySave = function () {
      if (this._skipNextHistory) return true;
      try {
        this.history = this.history.slice(0, this.historyIndex + 1);
        const snapshot: HistorySnapshot = {};
        for (const key of stateKeys) {
          snapshot[key] = deepClone(this[key]);
        }
        this.history.push(snapshot);
        const max = getMaxHistory(this);
        if (this.history.length > max) {
          this.history.shift();
        } else {
          this.historyIndex++;
        }
        return true;
      } catch (e) {
        console.error('[History] Failed to save history state:', e);
        this._historyCorrupted = true;
        return false;
      }
    };

    store.$historyUndo = function () {
      if (this._historyCorrupted || this.historyIndex <= 0) {
        if (this._historyCorrupted) {
          console.error(
            '[History] History is corrupted, undo disabled. Please save workflow manually.',
          );
        }
        return null;
      }
      this._skipNextHistory = true;
      try {
        this.historyIndex--;
        const state = this.history[this.historyIndex];
        for (const key of stateKeys) {
          this[key] = deepClone(state[key]);
        }
        return state;
      } catch (e) {
        console.error('[History] Undo failed:', e);
        return null;
      } finally {
        this._skipNextHistory = false;
        // 清除所有待执行的防抖保存，防止撤销后延迟触发覆盖历史
        Object.keys(debounceTimers).forEach((name) => {
          clearTimeout(debounceTimers[name]);
          delete debounceTimers[name];
        });
      }
    };

    store.$historyRedo = function () {
      if (this._historyCorrupted || this.historyIndex >= this.history.length - 1) {
        if (this._historyCorrupted) {
          console.error(
            '[History] History is corrupted, redo disabled. Please save workflow manually.',
          );
        }
        return null;
      }
      this._skipNextHistory = true;
      try {
        this.historyIndex++;
        const state = this.history[this.historyIndex];
        for (const key of stateKeys) {
          this[key] = deepClone(state[key]);
        }
        return state;
      } catch (e) {
        console.error('[History] Redo failed:', e);
        return null;
      } finally {
        this._skipNextHistory = false;
        // 清除所有待执行的防抖保存，防止重做后延迟触发覆盖历史
        Object.keys(debounceTimers).forEach((name) => {
          clearTimeout(debounceTimers[name]);
          delete debounceTimers[name];
        });
      }
    };

    store.$historyClear = function () {
      this.history = [];
      this.historyIndex = -1;
      this._historyCorrupted = false;
      // 清除所有待执行的防抖保存
      Object.keys(debounceTimers).forEach((name) => {
        clearTimeout(debounceTimers[name]);
        delete debounceTimers[name];
      });
    };

    // 监听 action 自动保存历史（仅当 state 实际变化时）
    store.$onAction(({ name, after }) => {
      const trackAction = options.trackActions?.includes(name);
      const debounceAction = options.debounceActions && name in options.debounceActions;

      if (trackAction || debounceAction) {
        // 记录 action 前的 state 快照（JSON.stringify 可检测数组/对象原地修改）
        const beforeSnapshot = stateKeys.map((key) => JSON.stringify(store[key]));

        after(() => {
          // 比较 action 后的 state，无变化则跳过
          const changed = stateKeys.some((key, idx) => JSON.stringify(store[key]) !== beforeSnapshot[idx]);
          if (!changed) return;

          if (trackAction) {
            store.$historySave();
          }
          if (debounceAction) {
            const delay = options.debounceActions![name];
            if (debounceTimers[name]) clearTimeout(debounceTimers[name]);
            debounceTimers[name] = setTimeout(() => store.$historySave(), delay);
          }
        });
      }
    });
  };
}
