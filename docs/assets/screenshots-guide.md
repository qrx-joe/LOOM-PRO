# 截图清单

## 必需（放 README）

| # | 场景 | 保存路径 | 命名 | README 引用 |
|---|------|----------|------|-------------|
| 1 | 工作流画布全景（拖拽编排，7 种节点可见，有连线） | `docs/assets/` | `workflow-canvas.png` | `![工作流画布](docs/assets/workflow-canvas.png)` |
| 2 | 属性面板 + fx 变量引用（展示节点配置细节） | `docs/assets/` | `node-config.png` | `![节点配置](docs/assets/node-config.png)` |
| 3 | 知识库文档列表 + 上传弹窗 | `docs/assets/` | `knowledge-base.png` | `![知识库](docs/assets/knowledge-base.png)` |
| 4 | 聊天界面（SSE 流式输出中，带引用来源高亮） | `docs/assets/` | `chat-streaming.png` | `![对话界面](docs/assets/chat-streaming.png)` |

## 可选（放 README 或文档）

| # | 场景 | 保存路径 | 命名 |
|---|------|----------|------|
| 5 | 登录界面（JWT 认证入口） | `docs/assets/` | `login.png` |
| 6 | 混合检索结果（向量 + 关键词双栏对比） | `docs/assets/` | `hybrid-search.png` |
| 7 | 补偿执行日志（失败节点 + rollback 状态） | `docs/assets/` | `compensation-log.png` |
| 8 | 整体 Dashboard / 工作室首页 | `docs/assets/` | `dashboard.png` |

## 命名规范

- 全小写，kebab-case
- 用 `-` 连接词，不用下划线
- 后缀统一 `.png`（兼容性最好）
- 避免 `screenshot-1`、`img-2` 这种无意义命名

## 截图要求

- 分辨率：1920x1080 或更高，确保文字清晰
- 背景：用暗色主题截图（工业靛蓝），放 GitHub 深色模式更协调
- 关键元素：标注红框或箭头指向核心交互点
- 不要暴露 API Key、密码等敏感信息
