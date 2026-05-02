<script setup lang="ts">
import type { Session } from '@/types';
import { Fold, Expand } from '@element-plus/icons-vue';

const props = defineProps<{
  sessions: Session[];
  currentSessionId: string;
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'create'): void;
  (e: 'delete', id: string): void;
  (e: 'toggle-collapse'): void;
}>();

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const handleDelete = (e: Event, id: string) => {
  e.stopPropagation();
  emit('delete', id);
};
</script>

<template>
  <aside class="sessions-sidebar" :class="{ collapsed }">
    <!-- 收起状态 -->
    <div v-if="collapsed" class="collapsed-content">
      <button class="btn-expand" title="展开侧边栏" @click="emit('toggle-collapse')">
        <el-icon :size="20">
          <Expand />
        </el-icon>
      </button>
      <button class="btn-new-chat-mini" title="新对话" @click="emit('create')">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div class="collapsed-sessions">
        <div
          v-for="session in props.sessions.slice(0, 8)"
          :key="session.id"
          class="session-dot"
          :class="{ active: session.id === props.currentSessionId }"
          :title="session.title || '新对话'"
          @click="emit('select', session.id)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 展开状态 -->
    <template v-else>
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">💬</div>
          <span class="logo-text">对话历史</span>
          <button class="btn-collapse" title="收起侧边栏" @click="emit('toggle-collapse')">
            <el-icon :size="16">
              <Fold />
            </el-icon>
          </button>
        </div>
        <button class="btn-new-chat" @click="emit('create')">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新对话
        </button>
      </div>

      <div class="session-list">
        <div
          v-for="session in props.sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: session.id === props.currentSessionId }"
          @click="emit('select', session.id)"
        >
          <div class="session-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div class="session-info">
            <div class="session-title">
              {{ session.title || '新对话' }}
            </div>
            <div class="session-time">
              {{ formatTime(session.updatedAt || session.createdAt || '') }}
            </div>
          </div>
          <button class="btn-delete" title="删除" @click="handleDelete($event, session.id)">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
          </button>
        </div>
      </div>

      <div v-if="sessions.length === 0" class="empty-sessions">
        <div class="empty-icon">🗨️</div>
        <div class="empty-text">还没有对话</div>
        <div class="empty-hint">点击「新对话」开始</div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.sessions-sidebar {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  box-shadow: var(--shadow-sm);
  transition: width 0.3s ease;
  width: 280px;
}

.sessions-sidebar.collapsed {
  width: 60px;
}

.collapsed-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  gap: 12px;
  height: 100%;
}

.btn-expand {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-border-light);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-expand:hover {
  background: var(--color-border);
  color: var(--color-dark);
}

.btn-new-chat-mini {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-new-chat-mini:hover {
  background: var(--color-primary-hover);
}

.collapsed-sessions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  overflow-y: auto;
  padding: 8px 0;
}

.session-dot {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-medium);
  transition: all var(--transition-fast);
}

.session-dot:hover {
  background: var(--color-border-light);
  color: var(--color-dark);
}

.session-dot.active {
  background: var(--color-border-light);
  color: var(--color-dark);
}

.sidebar-header {
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 4px;
}

.logo-icon {
  font-size: 20px;
  filter: grayscale(0.2);
}

.logo-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  letter-spacing: 0.5px;
  flex: 1;
}

.btn-collapse {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-collapse:hover {
  background: var(--color-border-light);
  color: var(--color-dark);
}

.btn-new-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-new-chat:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-new-chat:active {
  transform: translateY(0);
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-list::-webkit-scrollbar {
  width: 4px;
}

.session-list::-webkit-scrollbar-track {
  background: transparent;
}

.session-list::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: var(--radius-sm);
}

.session-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  color: var(--color-medium);
}

.session-item:hover {
  background: var(--color-border-light);
  color: var(--color-dark);
}

.session-item.active {
  background: var(--color-primary-light);
  color: var(--color-dark);
}

.session-icon {
  color: var(--color-border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.session-item.active .session-icon {
  color: var(--color-primary);
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: var(--font-size-xs);
  color: var(--color-medium);
  margin-top: 2px;
}

.session-item.active .session-time {
  color: var(--color-medium);
}

.btn-delete {
  opacity: 0;
  color: var(--color-border);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.session-item:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.empty-sessions {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.3;
  filter: grayscale(1);
}

.empty-text {
  color: var(--color-medium);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.empty-hint {
  color: var(--color-border);
  font-size: var(--font-size-xs);
}
</style>
