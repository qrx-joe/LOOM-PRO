# 开发循环模式记录

## 模式 1：窄类型声明 + 宽类型赋值 = 读属性时爆炸

**场景**：类字段声明为 `{ source: string; target: string }[]`，但实际存储的是 `WorkflowEdge[]`（含 `id`、`label`、`branchType` 等额外属性）。
**触发条件**：移除 `.find((item: any) => ...)` 中的 `any` 后，TypeScript 立即报错 `Property 'id' does not exist`。
**根因**：TS 结构子类型允许"宽类型赋值给窄类型"，但读取时窄类型上不存在额外属性。
**对策**：将字段声明从窄类型改为实际类型 `WorkflowEdge[]`，从源头对齐。

## 模式 2：`any` 是类型系统的静音开关，不是解决方案

**场景**：`node.data` 声明为 `Record<string, any>`，导致所有下游访问（`node.data?.httpConfig`、`node.data?.prompt` 等）全部失去类型检查。
**后果**：运行时数据格式错误（如缺少必填字段、类型不匹配）要到执行阶段才暴露，无法在编译期拦截。
**对策**：DTO 和 Entity 中的 JSONB 字段应使用具体类型（如 `WorkflowNode[]`、`WorkflowEdge[]`），哪怕数据库本身不强制结构。

## 模式 3：`as` 断言与 `any` 是同构的掩盖手段

**场景**：`stack.pop() as string` 掩盖了空数组时返回 `undefined` 的事实。
**后果**：运行时可能访问 `undefined`，导致后续逻辑异常。
**对策**：显式判空：`const current = stack.pop(); if (!current) continue;`

## 模式 4：安全校验应成对出现

**场景**：`table` 名做了 `/^[a-zA-Z0-9_]+$/` 校验，但同一张 SQL 语句中的 `idColumn` 没有校验。
**后果**：即使表名安全，恶意 `idColumn`（如 `id; DROP TABLE users; --`）仍可注入 SQL。
**对策**：所有拼接到 SQL 中的动态标识符（表名、列名、别名等）都应使用同一套白名单校验规则。

## 模式 5：Promise.race + AbortController 是真超时，不是假超时

**场景**：早期实现中 `withTimeout` 只让 Promise.race 提前返回，但后台任务继续运行。
**后果**：任务在超时后仍占用资源，甚至可能在后续代码执行期间完成并产生副作用（幽灵写入）。
**对策**：超时触发时调用 `controller.abort()`，确保底层 I/O（fetch/axios/DB 查询）真正被取消。

## 模式 6：深克隆应在重试/回滚边界处强制使用

**场景**：重试前如果只做浅拷贝（`{ ...variables }`），嵌套对象引用会被共享。
**后果**：第一次尝试修改嵌套对象后，回滚到 snapshot 时嵌套部分仍保留修改值（浅拷贝污染）。
**对策**：使用 `structuredClone`（失败时 fallback 到 `JSON.parse(JSON.stringify())`）做真正的深克隆。
