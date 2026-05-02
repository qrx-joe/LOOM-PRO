# 开发循环关键指标

## 本轮工作统计（refactor/schema-and-history-plugin 分支）

| 维度 | 数值 |
|------|------|
| 修复漏洞/问题总数 | 14（6 P0/P1 + 5 P2 + 3 变式） |
| 修改文件数 | 11 个后端文件 |
| 新增 commit 数 | 3 |
| 类型检查失败次数 | 2（修复 P2 时 edges 类型暴露问题；已修复） |
| 测试失败次数 | 1（修复 P2 时连带类型错误；已修复） |

## 各批次问题分布

### P0/P1 级漏洞（commit `8388624`）
- P0-1: 超时不取消后台任务（AbortController 贯通）
- P0-2: 回滚/重试浅拷贝污染（deepClone）
- P0-3: 补偿执行无超时（withTimeout 10s）
- P1-4: 补偿失败静默丢失（compensationStatus/compensationErrors）
- P1-5: 补偿栈清空导致失败丢失（while + pop）
- P1-6: 数值校验可被 NaN/Infinity 绕过（safeNumber + Number.isFinite）

### P2 级问题（commit `1857bee`）
- P2-1: replaceVariables 正则不匹配嵌套路径
- P2-2: 工作流输出包含所有中间变量（end.outputKey）
- P2-3: 条件为假时错误回退到 true 分支
- P2-4: evaluateCondition String(undefined) 陷阱
- P2-5: edges 字段类型声明过窄 + any 掩盖

### 变式修复（commit `229f2c9`）
- 变式 1: workflow.entity.ts / workflow.dto.ts nodes/edges 从 any 改为具体类型
- 变式 2: workflow.service.ts `stack.pop() as string` 改为判空
- 变式 3: compensation-executor.ts idColumn 未校验导致 SQL 注入风险

## 质量门禁执行情况

| 检查项 | 执行次数 | 通过率 |
|--------|----------|--------|
| 后端类型检查 `pnpm tsc --noEmit` | 5+ | 100% |
| 工作流引擎测试 `pnpm test:workflow` | 4+ | 100% |
| 前端类型检查 `pnpm vue-tsc --noEmit` | 4+ | 100% |
