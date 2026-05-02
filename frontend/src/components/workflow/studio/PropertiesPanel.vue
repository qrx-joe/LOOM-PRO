<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ElCollapseTransition } from 'element-plus';
import { Setting, Delete, InfoFilled, ArrowRight, Connection } from '@element-plus/icons-vue';
import { useKnowledgeStore } from '@/stores/knowledge';
import { NODE_TYPE_CONFIGS, type NodeField } from '@/config/node-config-schema';

const props = defineProps<{
  node: any;
  edge?: any;
}>();

const emit = defineEmits(['update', 'delete', 'update-edge', 'delete-edge']);

const knowledgeStore = useKnowledgeStore();

onMounted(() => {
  knowledgeStore.fetchKnowledgeBases();
});

// Schema-driven 节点配置
const currentNodeConfig = computed(() => {
  if (!props.node?.type) return null;
  return NODE_TYPE_CONFIGS[props.node.type] || null;
});

const isTrigger = computed(() => props.node?.type === 'trigger');

// 根据字段类型获取当前值
const getFieldValue = (field: NodeField) => {
  const data = props.node?.data || {};
  const value = data[field.key];
  return value !== undefined ? value : field.defaultValue;
};

// 判断字段是否可见
const isFieldVisible = (field: NodeField) => {
  if (!field.visibleWhen) return true;
  return field.visibleWhen(props.node?.data || {});
};

// 获取 select 字段的选项
const getSelectOptions = (field: NodeField) => {
  if (field.key === 'dataset') {
    return knowledgeStore.knowledgeBases.map((kb) => ({ label: kb.name, value: kb.id }));
  }
  return field.options || [];
};

// 展开/折叠状态
const expandedSections = ref<Record<string, boolean>>({
  basic: true,
  config: true,
  input: false,
  output: false,
  error: false,
});

const toggleSection = (section: string) => {
  if (section in expandedSections.value) {
    expandedSections.value[section] = !expandedSections.value[section];
  }
};
</script>

<template>
  <div class="properties-panel">
    <!-- 空状态 -->
    <div v-if="!node && !edge" class="empty-state">
      <el-icon class="empty-icon">
        <Setting />
      </el-icon>
      <span class="empty-text">选择节点或连线进行配置</span>
    </div>

    <!-- 边编辑面板 -->
    <div v-else-if="edge" class="config-content">
      <div class="panel-header">
        <div class="header-left">
          <span class="node-type-badge type-edge">
            <el-icon><Connection /></el-icon>
            连线
          </span>
          <span class="node-id">ID: {{ edge.id.slice(0, 8) }}</span>
        </div>
        <el-button link type="danger" :icon="Delete" @click="$emit('delete-edge', edge.id)" />
      </div>

      <div class="config-sections">
        <div class="section">
          <div class="section-header" @click="toggleSection('basic')">
            <span class="section-title">连线配置</span>
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.basic }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.basic" class="section-content">
              <el-form label-position="top" size="default">
                <el-form-item label="连线标签">
                  <el-input
                    :model-value="edge.label"
                    placeholder="输入连线标签（可选）"
                    @input="$emit('update-edge', edge.id, { label: $event })"
                  />
                </el-form-item>
                <el-form-item label="分支类型">
                  <el-select
                    :model-value="edge.branchType || ''"
                    style="width: 100%"
                    clearable
                    placeholder="选择分支类型"
                    @update:model-value="
                      $emit('update-edge', edge.id, {
                        branchType: $event || undefined,
                        label: $event || edge.label,
                      })
                    "
                  >
                    <el-option label="True (条件成立)" value="True" />
                    <el-option label="False (条件不成立)" value="False" />
                  </el-select>
                </el-form-item>
                <el-form-item label="连线样式">
                  <el-select
                    :model-value="edge.type || 'default'"
                    style="width: 100%"
                    @update:model-value="$emit('update-edge', edge.id, { type: $event })"
                  >
                    <el-option label="默认" value="default" />
                    <el-option label="分支线" value="branch" />
                  </el-select>
                </el-form-item>
                <el-form-item label="动画效果">
                  <el-switch
                    :model-value="edge.animated || false"
                    @update:model-value="$emit('update-edge', edge.id, { animated: $event })"
                  />
                </el-form-item>
              </el-form>
            </div>
          </el-collapse-transition>
        </div>

        <div class="section">
          <div class="section-header" @click="toggleSection('config')">
            <span class="section-title">连接信息</span>
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.config }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.config" class="section-content">
              <div class="info-row">
                <span class="info-label">源节点</span>
                <span class="info-value">{{ edge.source }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">目标节点</span>
                <span class="info-value">{{ edge.target }}</span>
              </div>
              <div v-if="edge.sourceHandle" class="info-row">
                <span class="info-label">源端口</span>
                <span class="info-value">{{ edge.sourceHandle }}</span>
              </div>
              <div v-if="edge.targetHandle" class="info-row">
                <span class="info-label">目标端口</span>
                <span class="info-value">{{ edge.targetHandle }}</span>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>

    <!-- 节点编辑面板 -->
    <div v-else class="config-content">
      <!-- 节点头部 -->
      <div class="panel-header">
        <div class="header-left">
          <span class="node-type-badge" :class="`type-${node.type}`">
            {{ node.type?.toUpperCase() || 'NODE' }}
          </span>
          <span class="node-id">ID: {{ node.id.slice(0, 8) }}</span>
        </div>
        <el-button link type="danger" :icon="Delete" @click="$emit('delete', node.id)" />
      </div>

      <div class="config-sections">
        <!-- 基本信息 -->
        <div class="section">
          <div class="section-header" @click="toggleSection('basic')">
            <span class="section-title">基本信息</span>
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.basic }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.basic" class="section-content">
              <el-form label-position="top" size="default">
                <el-form-item label="节点名称">
                  <el-input
                    :model-value="node.data?.label"
                    placeholder="输入节点名称"
                    @input="$emit('update', node.id, { label: $event })"
                  />
                </el-form-item>
                <el-form-item label="节点描述">
                  <el-input
                    type="textarea"
                    :rows="2"
                    :model-value="node.data?.description"
                    placeholder="描述节点功能（可选）"
                    @input="$emit('update', node.id, { description: $event })"
                  />
                </el-form-item>
              </el-form>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 节点配置 -->
        <div class="section">
          <div class="section-header" @click="toggleSection('config')">
            <span class="section-title">节点配置</span>
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.config }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.config" class="section-content">
              <el-form label-position="top" size="default">
                <!-- Schema-driven 节点配置 -->
                <template v-if="currentNodeConfig">
                  <!-- 提示信息 -->
                  <template v-for="tip in currentNodeConfig.tips" :key="tip.content">
                    <el-alert :type="tip.type" :closable="false" show-icon>
                      <template #default>
                        <div class="tip-content">{{ tip.content }}</div>
                      </template>
                    </el-alert>
                  </template>

                  <!-- 字段渲染 -->
                  <template v-for="field in currentNodeConfig.fields" :key="field.key">
                    <template v-if="isFieldVisible(field)">
                      <el-form-item :label="field.label">
                        <el-input
                          v-if="field.type === 'text'"
                          :model-value="getFieldValue(field)"
                          :placeholder="field.placeholder"
                          @input="$emit('update', node.id, { [field.key]: $event })"
                        />
                        <el-input
                          v-else-if="field.type === 'textarea'"
                          type="textarea"
                          :rows="field.rows || 3"
                          :model-value="getFieldValue(field)"
                          :placeholder="field.placeholder"
                          :class="field.key === 'code' ? 'code-editor' : ''"
                          @input="$emit('update', node.id, { [field.key]: $event })"
                        />
                        <el-input-number
                          v-else-if="field.type === 'number'"
                          :model-value="getFieldValue(field)"
                          :min="field.min"
                          :max="field.max"
                          :step="field.step"
                          style="width: 100%"
                          @update:model-value="$emit('update', node.id, { [field.key]: $event })"
                        />
                        <el-select
                          v-else-if="field.type === 'select'"
                          :model-value="getFieldValue(field)"
                          :placeholder="field.placeholder"
                          :loading="field.key === 'dataset' && knowledgeStore.loadingBases"
                          clearable
                          style="width: 100%"
                          @update:model-value="$emit('update', node.id, { [field.key]: $event })"
                        >
                          <el-option
                            v-for="opt in getSelectOptions(field)"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                          />
                        </el-select>
                        <el-switch
                          v-else-if="field.type === 'switch'"
                          :model-value="getFieldValue(field)"
                          @update:model-value="$emit('update', node.id, { [field.key]: $event })"
                        />
                        <el-slider
                          v-else-if="field.type === 'slider'"
                          :model-value="getFieldValue(field)"
                          :min="field.min"
                          :max="field.max"
                          :step="field.step"
                          show-input
                          @update:model-value="$emit('update', node.id, { [field.key]: $event })"
                        />
                      </el-form-item>
                    </template>
                  </template>
                </template>
              </el-form>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 输入变量 -->
        <div v-if="!isTrigger" class="section">
          <div class="section-header" @click="toggleSection('input')">
            <span class="section-title">输入变量</span>
            <el-badge
              :value="(node.data?.inputs || []).length"
              :hidden="(node.data?.inputs || []).length === 0"
              type="primary"
              class="section-badge"
            />
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.input }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.input" class="section-content">
              <div class="var-list">
                <div v-for="(item, index) in node.data?.inputs || []" :key="index" class="var-item">
                  <el-input
                    v-model="item.name"
                    placeholder="变量名"
                    size="small"
                    class="var-name"
                    @change="$emit('update', node.id, { inputs: [...(node.data?.inputs || [])] })"
                  />
                  <el-select
                    v-model="item.type"
                    placeholder="类型"
                    size="small"
                    class="var-type"
                    @change="$emit('update', node.id, { inputs: [...(node.data?.inputs || [])] })"
                  >
                    <el-option label="String" value="string" />
                    <el-option label="Number" value="number" />
                    <el-option label="Boolean" value="boolean" />
                    <el-option label="Object" value="object" />
                    <el-option label="Array" value="array" />
                  </el-select>
                  <el-button
                    link
                    type="danger"
                    :icon="Delete"
                    class="var-delete"
                    @click="
                      () => {
                        const newInputs = [...(node.data?.inputs || [])];
                        newInputs.splice(index, 1);
                        $emit('update', node.id, { inputs: newInputs });
                      }
                    "
                  />
                </div>
              </div>
              <el-button
                class="add-btn"
                size="small"
                @click="
                  () => {
                    const newInputs = [
                      ...(node.data?.inputs || []),
                      { name: 'variable', type: 'string' },
                    ];
                    $emit('update', node.id, { inputs: newInputs });
                  }
                "
              >
                + 添加输入变量
              </el-button>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 输出变量 -->
        <div v-if="!isEnd" class="section">
          <div class="section-header" @click="toggleSection('output')">
            <span class="section-title">输出变量</span>
            <el-badge
              :value="(node.data?.outputs || []).length"
              :hidden="(node.data?.outputs || []).length === 0"
              type="success"
              class="section-badge"
            />
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.output }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.output" class="section-content">
              <div class="var-list">
                <div
                  v-for="(item, index) in node.data?.outputs || []"
                  :key="index"
                  class="var-item"
                >
                  <el-input
                    v-model="item.name"
                    placeholder="变量名"
                    size="small"
                    class="var-name"
                    @change="$emit('update', node.id, { outputs: [...(node.data?.outputs || [])] })"
                  />
                  <el-select
                    v-model="item.type"
                    placeholder="类型"
                    size="small"
                    class="var-type"
                    @change="$emit('update', node.id, { outputs: [...(node.data?.outputs || [])] })"
                  >
                    <el-option label="String" value="string" />
                    <el-option label="Number" value="number" />
                    <el-option label="Boolean" value="boolean" />
                    <el-option label="Object" value="object" />
                    <el-option label="Array" value="array" />
                  </el-select>
                  <el-button
                    link
                    type="danger"
                    :icon="Delete"
                    class="var-delete"
                    @click="
                      () => {
                        const newOutputs = [...(node.data?.outputs || [])];
                        newOutputs.splice(index, 1);
                        $emit('update', node.id, { outputs: newOutputs });
                      }
                    "
                  />
                </div>
              </div>
              <el-button
                class="add-btn"
                size="small"
                @click="
                  () => {
                    const newOutputs = [
                      ...(node.data?.outputs || []),
                      { name: 'result', type: 'string' },
                    ];
                    $emit('update', node.id, { outputs: newOutputs });
                  }
                "
              >
                + 添加输出变量
              </el-button>
            </div>
          </el-collapse-transition>
        </div>

        <!-- 错误处理 -->
        <div class="section">
          <div class="section-header" @click="toggleSection('error')">
            <span class="section-title">错误处理</span>
            <el-icon class="toggle-icon" :class="{ expanded: expandedSections.error }">
              <ArrowRight />
            </el-icon>
          </div>
          <el-collapse-transition>
            <div v-show="expandedSections.error" class="section-content">
              <el-form label-position="top" size="default">
                <el-form-item label="超时时间 (ms)">
                  <el-input-number
                    :model-value="node.data?.timeoutMs || 0"
                    :min="0"
                    :max="120000"
                    :step="1000"
                    style="width: 100%"
                    @update:model-value="$emit('update', node.id, { timeoutMs: $event })"
                  />
                </el-form-item>
                <el-form-item label="重试次数">
                  <el-input-number
                    :model-value="node.data?.retryCount || 0"
                    :min="0"
                    :max="10"
                    style="width: 100%"
                    @update:model-value="$emit('update', node.id, { retryCount: $event })"
                  />
                </el-form-item>
                <el-form-item label="重试间隔 (ms)">
                  <el-input-number
                    :model-value="node.data?.retryDelayMs || 1000"
                    :min="0"
                    :max="30000"
                    :step="500"
                    style="width: 100%"
                    @update:model-value="$emit('update', node.id, { retryDelayMs: $event })"
                  />
                </el-form-item>
                <el-form-item label="失败时">
                  <el-select
                    :model-value="node.data?.onError || 'fail'"
                    style="width: 100%"
                    @update:model-value="$emit('update', node.id, { onError: $event })"
                  >
                    <el-option label="失败终止" value="fail" />
                    <el-option label="失败跳过" value="skip" />
                    <el-option label="回滚终止" value="rollback" />
                    <el-option label="补偿终止" value="compensate" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  width: 100%;
  height: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 12px;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  color: #dcdfe6;
}

.empty-text {
  font-size: 13px;
  color: #909399;
}

.config-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  background: #e4e7ed;
  color: #606266;
}

.node-type-badge.type-trigger {
  background: #fef0c7;
  color: #f59e0b;
}

.node-type-badge.type-llm {
  background: #f1f5f9;
  color: #0ea5e9;
}

.node-type-badge.type-knowledge {
  background: #d1fae5;
  color: #10b981;
}

.node-type-badge.type-condition {
  background: #ede9fe;
  color: #8b5cf6;
}

.node-type-badge.type-code {
  background: #e0e7ff;
  color: #6366f1;
}

.node-type-badge.type-end {
  background: #fee2e2;
  color: #ef4444;
}

.node-type-badge.type-edge {
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-type-badge.type-http {
  background: #ede9fe;
  color: #667eea;
}

.node-id {
  font-size: 11px;
  color: #909399;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.config-sections {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.section {
  border-bottom: 1px solid #f0f0f0;
}

.section:last-child {
  border-bottom: none;
}

.section-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.section-header:hover {
  background: #f5f7fa;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.section-badge {
  margin-right: 8px;
}

.toggle-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.3s;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

.section-content {
  padding: 0 16px 16px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-size: 12px !important;
  color: #606266 !important;
  font-weight: 500;
  margin-bottom: 8px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  font-size: 13px;
}

.code-editor :deep(textarea) {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  background: #f8fafc;
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

:deep(.el-alert) {
  padding: 8px 12px;
  margin-top: 8px;
}

:deep(.el-alert__content) {
  padding: 0;
}

:deep(.el-empty) {
  padding: 20px 0;
}

:deep(.el-empty__description) {
  font-size: 12px;
  color: #909399;
}

/* 滚动条样式 */
.config-sections::-webkit-scrollbar {
  width: 6px;
}

.config-sections::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.config-sections::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.config-sections::-webkit-scrollbar-track {
  background: transparent;
}

.var-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.var-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.var-name {
  flex: 1;
  min-width: 0;
}

.var-type {
  width: 85px !important;
  flex-shrink: 0;
}

.var-delete {
  padding: 4px;
  margin-left: 2px;
}

.add-btn {
  width: 100%;
  border-style: dashed !important;
  color: #606266;
  font-weight: normal;
}

.add-btn:hover {
  color: var(--color-primary-500);
  border-color: var(--color-primary-300) !important;
  background: var(--color-primary-50) !important;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 12px;
  color: #303133;
  font-family: 'JetBrains Mono', Consolas, monospace;
}
</style>
