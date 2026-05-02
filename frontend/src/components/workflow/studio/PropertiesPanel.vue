<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { ElCollapseTransition, ElPopover } from 'element-plus';
import { Setting, Delete, ArrowRight, Connection } from '@element-plus/icons-vue';
import { useKnowledgeStore } from '@/stores/knowledge';
import { useVariableStore } from '@/stores/variable';
import { useWorkflowStore } from '@/stores/workflow';
import { NODE_TYPE_CONFIGS, type NodeField } from '@/config/node-config-schema';

const props = defineProps<{
  node: any;
  edge?: any;
}>();

const emit = defineEmits(['update', 'delete', 'update-edge', 'delete-edge']);

const knowledgeStore = useKnowledgeStore();
const variableStore = useVariableStore();
const workflowStore = useWorkflowStore();

onMounted(() => {
  knowledgeStore.fetchKnowledgeBases();
});

// 工作流节点变化时重新收集变量
watch(
  () => workflowStore.nodes,
  (nodes) => {
    variableStore.collectFromNodes(nodes);
  },
  { immediate: true, deep: true },
);

// Schema-driven 节点配置
const currentNodeConfig = computed(() => {
  if (!props.node?.type) return null;
  return NODE_TYPE_CONFIGS[props.node.type] || null;
});

const isTrigger = computed(() => props.node?.type === 'trigger');
const isEnd = computed(() => props.node?.type === 'end');

// 根据字段类型获取当前值（含向后兼容处理）
const getFieldValue = (field: NodeField) => {
  const data = props.node?.data || {};
  let value = data[field.key];
  // 兼容旧工作流：timeout 字段已重命名为 timeoutMs
  if (value === undefined && field.key === 'timeoutMs' && data.timeout !== undefined) {
    value = data.timeout;
  }
  return value !== undefined ? value : field.defaultValue;
};

// 判断字段是否可见（带异常降级，防止自定义 visibleWhen 抛错导致面板白屏）
const isFieldVisible = (field: NodeField) => {
  if (!field.visibleWhen) return true;
  try {
    return field.visibleWhen(props.node?.data || {});
  } catch (e) {
    console.error(`[PropertiesPanel] visibleWhen error for field "${field.key}":`, e);
    return true; // 异常时默认显示，避免用户配置丢失
  }
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
});

const toggleSection = (section: string) => {
  if (section in expandedSections.value) {
    expandedSections.value[section] = !expandedSections.value[section];
  }
};

// ========== 变量选择器 ==========
const variablePopoverVisible = ref<Record<string, boolean>>({});

const insertVariableRef = (fieldKey: string, ref: string) => {
  const current = props.node?.data?.[fieldKey] || '';
  const newValue = current + `{{${ref}}}`;
  emit('update', props.node.id, { [fieldKey]: newValue });
  variablePopoverVisible.value[fieldKey] = false;
};

const variableGroups = computed(() => [
  {
    label: '输入变量',
    options: variableStore.inputVariables,
  },
  {
    label: '系统变量',
    options: variableStore.systemVariables,
  },
  {
    label: '节点输出',
    options: variableStore.nodeVariables,
  },
]);
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
                        <!-- text 字段：带变量引用按钮 -->
                        <div v-if="field.type === 'text'" class="input-with-var">
                          <el-input
                            :model-value="getFieldValue(field)"
                            :placeholder="field.placeholder"
                            @input="$emit('update', node.id, { [field.key]: $event })"
                          />
                          <el-popover
                            :visible="variablePopoverVisible[field.key]"
                            placement="bottom-start"
                            :width="240"
                            trigger="click"
                            @update:visible="variablePopoverVisible[field.key] = $event"
                          >
                            <template #reference>
                              <el-button class="var-btn" title="插入变量引用">fx</el-button>
                            </template>
                            <div class="var-selector">
                              <div
                                v-for="group in variableGroups"
                                :key="group.label"
                                class="var-group"
                              >
                                <div class="var-group-label">{{ group.label }}</div>
                                <div
                                  v-for="v in group.options"
                                  :key="v.id"
                                  class="var-option"
                                  @click="insertVariableRef(field.key, v.id)"
                                >
                                  {{ v.name }}
                                </div>
                                <div
                                  v-if="group.options.length === 0"
                                  class="var-empty"
                                >
                                  暂无可用变量
                                </div>
                              </div>
                            </div>
                          </el-popover>
                        </div>
                        <!-- textarea 字段：带变量引用按钮 -->
                        <div v-else-if="field.type === 'textarea'" class="input-with-var">
                          <el-input
                            type="textarea"
                            :rows="field.rows || 3"
                            :model-value="getFieldValue(field)"
                            :placeholder="field.placeholder"
                            :class="field.key === 'code' ? 'code-editor' : ''"
                            @input="$emit('update', node.id, { [field.key]: $event })"
                          />
                          <el-popover
                            :visible="variablePopoverVisible[field.key]"
                            placement="bottom-start"
                            :width="240"
                            trigger="click"
                            @update:visible="variablePopoverVisible[field.key] = $event"
                          >
                            <template #reference>
                              <el-button class="var-btn" title="插入变量引用">fx</el-button>
                            </template>
                            <div class="var-selector">
                              <div
                                v-for="group in variableGroups"
                                :key="group.label"
                                class="var-group"
                              >
                                <div class="var-group-label">{{ group.label }}</div>
                                <div
                                  v-for="v in group.options"
                                  :key="v.id"
                                  class="var-option"
                                  @click="insertVariableRef(field.key, v.id)"
                                >
                                  {{ v.name }}
                                </div>
                                <div
                                  v-if="group.options.length === 0"
                                  class="var-empty"
                                >
                                  暂无可用变量
                                </div>
                              </div>
                            </div>
                          </el-popover>
                        </div>
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
                <template v-else>
                  <el-alert type="warning" :closable="false" show-icon>
                    <template #default>
                      <div class="tip-content">
                        未知节点类型 "{{ node.type }}"，未找到对应的配置 schema。
                      </div>
                    </template>
                  </el-alert>
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

      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  width: 100%;
  height: 100%;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-medium);
  gap: 12px;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  color: var(--color-border);
}

.empty-text {
  font-size: var(--font-size-sm);
  color: var(--color-medium);
}

.config-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-border-light);
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
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  letter-spacing: 0.5px;
  background: var(--color-border);
  color: var(--color-medium);
}

.node-type-badge.type-trigger {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.node-type-badge.type-llm {
  background: var(--color-border-light);
  color: var(--color-info);
}

.node-type-badge.type-knowledge {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.node-type-badge.type-condition {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.node-type-badge.type-code {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.node-type-badge.type-end {
  background: var(--color-error-bg);
  color: var(--color-error);
}

.node-type-badge.type-edge {
  background: var(--color-info-bg);
  color: var(--color-info);
  display: flex;
  align-items: center;
  gap: 4px;
}

.node-type-badge.type-http {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.node-id {
  font-size: var(--font-size-xs);
  color: var(--color-medium);
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.config-sections {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.section {
  border-bottom: 1px solid var(--color-border-light);
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
  transition: background var(--transition-fast);
}

.section-header:hover {
  background: var(--color-border-light);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-dark);
  flex: 1;
}

.section-badge {
  margin-right: 8px;
}

.toggle-icon {
  font-size: 14px;
  color: var(--color-medium);
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
  font-size: var(--font-size-xs) !important;
  color: var(--color-medium) !important;
  font-weight: var(--font-weight-medium);
  margin-bottom: 8px;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  font-size: var(--font-size-sm);
}

.code-editor :deep(textarea) {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  background: var(--color-border-light);
}

.tip-content {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
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
  font-size: var(--font-size-xs);
  color: var(--color-medium);
}

.config-sections::-webkit-scrollbar {
  width: 6px;
}

.config-sections::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.config-sections::-webkit-scrollbar-thumb:hover {
  background: var(--color-medium);
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
  color: var(--color-medium);
  font-weight: normal;
}

.add-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary) !important;
  background: var(--color-primary-light) !important;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.input-with-var {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.input-with-var :deep(.el-input),
.input-with-var :deep(.el-textarea) {
  flex: 1;
}

.var-btn {
  flex-shrink: 0;
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--color-medium);
  border-color: var(--color-border);
  background: var(--color-border-light);
  letter-spacing: 0;
}

.var-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.var-selector {
  max-height: 320px;
  overflow-y: auto;
}

.var-group {
  margin-bottom: 8px;
}

.var-group:last-child {
  margin-bottom: 0;
}

.var-group-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 0 6px;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 4px;
}

.var-option {
  padding: 6px 8px;
  font-size: 12px;
  color: var(--color-dark);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.var-option:hover {
  background: var(--color-border-light);
  color: var(--color-primary);
}

.var-empty {
  font-size: var(--font-size-xs);
  color: var(--color-border);
  padding: 4px 0;
  font-style: italic;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--color-medium);
}

.info-value {
  font-size: var(--font-size-xs);
  color: var(--color-dark);
  font-family: 'JetBrains Mono', Consolas, monospace;
}
</style>
