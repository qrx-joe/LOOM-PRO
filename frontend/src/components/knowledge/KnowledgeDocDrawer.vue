<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  selectedDoc: any;
  documentChunks: Array<{ id: string; content: string; chunkIndex: number }>;
  chunkLoading: boolean;
  chunkLimit: number;
  focusedChunkId: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:chunkLimit', value: number): void;
  (e: 'refresh'): void;
}>();
</script>

<template>
  <el-drawer
    :model-value="props.modelValue"
    title="文档详情"
    size="420px"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <div v-if="props.selectedDoc" class="doc-detail">
      <div class="detail-row">
        <span class="label">文件名</span>{{ props.selectedDoc.filename }}
      </div>
      <div class="detail-row">
        <span class="label">类型</span>{{ props.selectedDoc.fileType || '-' }}
      </div>
      <div class="detail-row">
        <span class="label">大小</span>{{ props.selectedDoc.fileSize || '-' }}
      </div>

      <div class="detail-section">
        <div class="section-title">分块参数</div>
        <div class="detail-row">
          <span class="label">size</span>{{ props.selectedDoc.metadata?.chunkSize ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">overlap</span>{{ props.selectedDoc.metadata?.overlap ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">chunks</span>{{ props.selectedDoc.metadata?.chunkCount ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">chars</span>{{ props.selectedDoc.metadata?.charCount ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">dim</span>{{ props.selectedDoc.metadata?.embeddingDim ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">chunkMs</span>{{ props.selectedDoc.metadata?.chunkMs ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">embedMs</span>{{ props.selectedDoc.metadata?.embedMs ?? '-' }}
        </div>
        <div class="detail-row">
          <span class="label">processMs</span>{{ props.selectedDoc.metadata?.processMs ?? '-' }}
        </div>
      </div>

      <div class="detail-section">
        <div class="section-title">分块示例</div>
        <div class="chunk-config">
          <el-input-number
            :model-value="props.chunkLimit"
            :min="1"
            :max="20"
            :step="1"
            @update:model-value="
              (value: number | undefined) => emit('update:chunkLimit', Number(value))
            "
          />
          <el-button size="small" @click="emit('refresh')"> 刷新 </el-button>
        </div>
        <div v-if="props.chunkLoading" class="loading">加载中...</div>
        <div v-else class="chunks">
          <div
            v-for="chunk in props.documentChunks"
            :id="`chunk-${chunk.id}`"
            :key="chunk.id"
            class="chunk-item"
            :class="{ focused: chunk.id === props.focusedChunkId }"
          >
            <div class="chunk-title">#{{ chunk.chunkIndex }}</div>
            <div class="chunk-content">
              {{ chunk.content }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.doc-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  font-size: var(--font-size-xs);
  color: var(--color-dark);
}

.label {
  display: inline-block;
  width: 90px;
  color: var(--color-medium);
}

.detail-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
}

.section-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: 6px;
  font-size: var(--font-size-sm);
  color: var(--color-dark);
}

.chunk-config {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.chunks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chunk-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px;
}

.chunk-item.focused {
  border-color: var(--color-info);
  box-shadow: 0 0 0 3px var(--color-info-bg);
}

.chunk-title {
  font-size: var(--font-size-xs);
  color: var(--color-medium);
  margin-bottom: 4px;
}

.chunk-content {
  font-size: var(--font-size-xs);
  color: var(--color-dark);
}

.loading {
  font-size: var(--font-size-xs);
  color: var(--color-medium);
}
</style>
