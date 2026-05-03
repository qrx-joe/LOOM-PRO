# LOOM-PLUS

> **AI 工作流编排平台 · 知识库 · 智能问答 · SSE 流式输出**
> 基于 AgentFlow Studio 骨架，融合 LOOM 织机精华模块的 plus 版本。

## 缘起

LOOM-PLUS 由两个项目合并而来：

| 来源              | 贡献                                                          |
| ----------------- | ------------------------------------------------------------- |
| AgentFlow Studio  | 整体架构骨架（engine/services/dto 分层）、工作流执行引擎      |
| LOOM 织机         | 撤销重做（Undo/Redo）、Markdown 文档处理、混合检索、工业靛蓝主题 |

## 技术栈

| 端   | 技术                                                            |
| ---- | --------------------------------------------------------------- |
| 前端 | Vue 3.4 · Pinia · Vue Flow · Element Plus · Vite 5              |
| 后端 | NestJS 10 · TypeORM · PostgreSQL 15 · Redis · JWT               |
| AI   | OpenAI 兼容 API（可配置 base URL）· text-embedding 向量模型     |

## 核心特性

- **可视化工作流**：拖拽编排 + Undo/Redo（最多 50 步历史）
- **7 种节点类型**：trigger / LLM / knowledge / condition / code / http / end
- **变量系统**：输入变量/系统变量/节点输出，属性面板 fx 按钮插入 `{{var}}` 引用
- **2s 防抖自动保存**：编辑后自动持久化，顶部状态栏实时反馈
- **错误处理**：compensate / skip / rollback 三策略，WorkflowError 语义分级
- **知识库 RAG**：支持 PDF / DOCX / Markdown，3 种切块策略（fixed / semantic / recursive），中文语义分隔符
- **混合检索**：RRF 融合（向量 + 关键词），支持 temperature 参数传递
- **SSE 流式输出**：实时对话体验
- **补偿执行**：6 种补偿动作（变量/http/文件/数据库），带路径安全校验
- **工业靛蓝设计语言**：来自 LOOM 织机的视觉系统

## 快速启动

### 一键启动（Windows）

```bat
start.bat
```

自动启动 Docker（PostgreSQL + Redis）、后端和前端开发服务器。

### 手动启动

```bash
# 1. 启动数据库
docker-compose up -d postgres redis

# 2. 后端（端口 3000）
cd backend && pnpm install && pnpm start:dev

# 3. 前端（端口 8080）
cd frontend && pnpm install && pnpm dev
```

### Docker 全栈部署

```bash
docker-compose up -d
# Backend → 3000  Frontend → 8080  PG → 5432  Redis → 6379
```

## 环境变量

后端 `backend/.env`：

| 变量              | 默认值                                                  |
| ----------------- | ------------------------------------------------------- |
| `DATABASE_URL`    | `postgresql://loomplus:loomplus123@localhost:5432/loomplus` |
| `REDIS_HOST`      | `localhost`                                             |
| `REDIS_PORT`      | `6379`                                                  |
| `OPENAI_API_KEY`  | -                                                       |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1`                             |
| `JWT_SECRET`      | -                                                       |

## 项目结构

```
LOOM-PLUS/
├── backend/                       # NestJS 10
│   └── src/
│       ├── workflow/             # 工作流：CRUD + 执行引擎
│       ├── knowledge/
│       │   ├── services/loom/    # LOOM 精华：chunking / document-processor
│       │   └── utils/text-splitter.ts  # 中文友好的递归切分
│       ├── chat/                 # 会话 + SSE 流式
│       ├── agent/                # Agent 编排
│       └── common/middleware/    # 日志中间件
├── frontend/                      # Vue 3.4
│   └── src/
│       ├── views/Workflow/       # 工作流主视图
│       ├── components/workflow/  # 节点工具栏（含 Undo/Redo 按钮）
│       ├── stores/
│       │   ├── workflow.ts       # 工作流状态（含 2s 防抖自动保存）
│       │   ├── variable.ts       # 变量系统（引用解析/类型推断）
│       │   └── plugins/
│       │       └── history.ts    # Undo/Redo 历史插件（最多 50 步）
│       └── config/
│           └── node-config-schema.ts  # 节点配置 Schema 驱动
├── docker-compose.yml             # 全栈编排
├── .github/workflows/ci.yml       # CI：lint + build + test
└── start.bat                      # Windows 一键启动
```

## 代码质量

- **pre-commit**：`lint-staged` → `prettier --write` + `eslint --fix`
- **commit-msg**：[Conventional Commits](https://www.conventionalcommits.org/)
- **CI**：GitHub Actions 在 push / PR 时执行 format check + lint + build + jest

```bash
pnpm run format          # 格式化全部
pnpm run format:check    # 检查格式
pnpm -C backend test     # 后端测试
pnpm -C backend lint     # 后端 lint
pnpm -C frontend lint    # 前端 lint
```

## 许可证

MIT
