<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { MoreFilled, Loading, Check, Close } from '@element-plus/icons-vue';

const props = defineProps<{
  id?: string;
  label?: string;
  icon?: any;
  color?: string;
  selected?: boolean;
  inputs?: Array<{ id: string; label?: string }>;
  outputs?: Array<{ id: string; label?: string }>;
  status?: string;
}>();

const headerStyle = computed(() => ({
  background: props.color ? `${props.color}15` : 'var(--color-border-light)',
  color: props.color || 'var(--color-medium)',
}));

const iconStyle = computed(() => ({
  background: props.color || 'var(--color-medium)',
  color: '#ffffff',
}));
</script>

<template>
  <div
    class="base-node"
    :class="{
      selected: selected,
      running: status === 'running',
      failed: status === 'failed',
      success: status === 'success',
    }"
  >
    <!-- Header -->
    <div class="node-header" :style="headerStyle">
      <div class="icon-box" :style="iconStyle">
        <component :is="icon" v-if="icon" />
      </div>
      <div class="node-title">
        {{ label }}
        <span v-if="status === 'running'" class="status-badge running"
          ><el-icon class="is-loading"><Loading /></el-icon
        ></span>
      </div>
      <div class="node-actions">
        <!-- Optional status icon -->
        <el-icon v-if="status === 'success'" color="var(--color-success)">
          <Check />
        </el-icon>
        <el-icon v-if="status === 'failed'" color="var(--color-error)">
          <Close />
        </el-icon>
        <el-icon class="more-btn">
          <MoreFilled />
        </el-icon>
      </div>
    </div>

    <!-- Body -->
    <div class="node-body">
      <slot />
    </div>

    <!-- Connection Handles (Dynamic) -->
    <!-- Inputs (Left) -->
    <div class="inputs">
      <Handle type="target" :position="Position.Left" class="handle-input" />
    </div>

    <!-- Outputs (Right) -->
    <div class="outputs">
      <Handle type="source" :position="Position.Right" class="handle-output" />
    </div>
  </div>
</template>

<style scoped>
.base-node {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  min-width: 240px;
  transition: all var(--transition-normal);
  position: relative;
}

/* Hover Effect: Lift & Deeper Shadow */
.base-node:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
  z-index: 10;
}

/* Selected State: Glow & Border */
.base-node.selected {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
}

.base-node.running {
  border-color: var(--color-primary-900);
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.2);
}

.base-node.failed {
  border-color: var(--color-error);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.base-node.success {
  border-color: var(--color-success);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

/* Header */
.node-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  transition: background 0.2s;
}

.icon-box {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.node-title {
  font-size: 14px;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-badge {
  display: flex;
  align-items: center;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-border);
  opacity: 0;
  transition: opacity 0.2s;
}

.base-node:hover .node-actions {
  opacity: 1;
}

.more-btn {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.more-btn:hover {
  background: var(--color-border-light);
  color: var(--color-dark);
}

/* Body */
.node-body {
  padding: 12px;
  font-size: 13px;
  color: var(--color-medium);
  line-height: 1.5;
}

/* Handles - Auto Hide */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  background: var(--color-medium);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0; /* Hidden by default */
  transform: scale(0.5);
}

.base-node:hover :deep(.vue-flow__handle),
.base-node.selected :deep(.vue-flow__handle) {
  opacity: 1;
  transform: scale(1);
}

:deep(.vue-flow__handle:hover) {
  width: 14px;
  height: 14px;
  background: var(--color-primary);
  transform: scale(1.2);
  border-color: var(--color-surface);
}

:deep(.vue-flow__handle-left) {
  left: -6px;
}

:deep(.vue-flow__handle-right) {
  right: -6px;
}
</style>
