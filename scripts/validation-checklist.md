# LOOM-PRO 重构校验清单

## 校验目标
本轮重构涉及：Undo/Redo 历史系统迁移到 Store、Schema-driven 属性面板、text-splitter 增强、字段兼容性与异常防护。

## 一、类型安全（Type Safety）
| 检查项 | 命令 | 通过标准 |
|--------|------|----------|
| 前端 TypeScript 编译 | `cd frontend && pnpm vue-tsc --noEmit` | 0 errors, 0 warnings |
| 后端 TypeScript 编译 | `cd backend && pnpm tsc --noEmit` | 0 errors |

## 二、代码规范（Lint）
| 检查项 | 命令 | 通过标准 |
|--------|------|----------|
| 前端 ESLint | `cd frontend && pnpm eslint src/stores/workflow.ts src/components/workflow/studio/PropertiesPanel.vue src/config/node-config-schema.ts src/composables/workflow/useWorkflowEdgeHandlers.ts --ext .ts,.vue` | 0 errors |
| 后端 ESLint | `cd backend && pnpm eslint src/knowledge/utils/text-splitter.ts src/knowledge/entities/knowledge-base.entity.ts --ext .ts` | 0 errors |

## 三、功能正确性（Functional Correctness）

### 3.1 Undo/Redo 历史系统
- [x] `undo()` 和 `redo()` 内部使用 try-finally，`_skipNextHistory` 在任何路径下都会被重置为 false
- [x] `saveHistory()` 深克隆失败时不会抛未捕获异常，仅 console.error 并静默跳过
- [x] `initHistory()` 深克隆失败时降级为空历史（nodes: [], edges: []），不阻断页面加载
- [x] 结构性变更（addNodes/removeNode/removeEdge/addEdge）自动调用 saveHistory
- [x] 配置变更（updateNodeData/updateEdgeData）500ms 防抖后调用 saveHistory
- [x] historyIndex 越界检查：undo 时 <=0 返回 null，redo 时 >=length-1 返回 null
- [x] undo/redo 执行后清除待触发的防抖定时器，防止延迟保存覆盖历史栈

### 3.2 Schema-driven 属性面板
- [x] 所有已知节点类型（llm/knowledge/condition/code/end/http/trigger）均有对应的 NODE_TYPE_CONFIGS schema
- [x] `getFieldValue` 对旧工作流 `timeout` → `timeoutMs` 做了向后兼容映射
- [x] `isFieldVisible` 对 `visibleWhen` 抛异常做了降级处理（默认显示）
- [x] 未知节点类型时显示警告提示，而非空白面板
- [x] dataset 字段从 knowledgeStore 动态拉取选项
- [x] text/textarea 字段显示变量引用按钮，支持变量插值

### 3.3 Text Splitter
- [x] 构造函数校验 chunkOverlap < chunkSize，否则抛明确错误
- [x] semanticChunk 的 overlap 计算使用 Math.max(0, ...) 防止负索引
- [x] 三种策略（fixed/semantic/recursive）的 splitText 入口均正常工作

### 3.4 属性面板变量选择器
- [x] text/textarea 字段渲染 fx 变量引用按钮
- [x] 点击弹出变量选择器，分类展示输入变量/系统变量/节点输出
- [x] 选择后插入 `{{var}}` 到当前光标位置
- [x] variableStore 正确收集和解析变量引用

## 四、边界情况与兜底策略（Edge Cases & Fallbacks）

### 4.1 历史系统边界
| 场景 | 预期行为 |
|------|----------|
| historyIndex = 0 时按 Ctrl+Z | 无反应（返回 null） |
| historyIndex = max 时按 Ctrl+Y | 无反应（返回 null） |
| 节点 data 包含不可序列化对象（如 DOM 引用） | saveHistory catch 到异常，历史不保存，系统不崩 |
| undo 执行期间 JSON.parse 抛异常 | finally 重置 _skipNextHistory，返回 null |
| undo 执行期间有未触发的防抖定时器 | finally 清除定时器，不污染历史栈 |

### 4.2 属性面板边界
| 场景 | 预期行为 |
|------|----------|
| 选中节点的 type 不在 NODE_TYPE_CONFIGS 中 | 显示警告"未知节点类型..." |
| visibleWhen 函数执行抛异常 | 字段默认显示，控制台输出错误 |
| knowledgeStore 加载失败 | dataset 下拉为空，不阻塞面板渲染 |
| 旧工作流保存的是 timeout 而非 timeoutMs | 超时字段正确回显旧值 |

## 五、回归检查（Regression）
- [x] WorkflowView.vue 不再手动调用 saveHistory，全部通过 store action 委托
- [x] useWorkflowEdgeHandlers.ts handleEdgeClick 未被删除（仍有引用），保持原样
- [x] NodeConfigDrawer.vue 和 NodePolicyFields.vue 已被删除且无引用残留
- [x] PropertiesPanel 的 onError 选项与后端枚举一致（fail/skip/rollback/compensate）
- [x] 已删除：useWorkflowHistory.ts、useWorkflowValidation.ts、variable.ts（死代码清理）

## 执行方式
1. 先跑类型检查和 lint（自动化）
2. 再人工逐项检查代码（代码审查）
3. 发现问题 → 记录 → 修复 → 重新跑对应检查项
