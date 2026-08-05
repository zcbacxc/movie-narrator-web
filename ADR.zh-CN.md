[![English](https://img.shields.io/badge/English-ADR-blue)](ADR.md)
[![简体中文](https://img.shields.io/badge/简体中文-架构决策记录-green)](ADR.zh-CN.md)

# 架构决策记录

本文档记录 **movie-narrator-web** 项目做出的关键架构决策。每条 ADR 遵循统一结构 —— 状态（Status）、背景（Context）、决策（Decision）、后果（Consequences）与备选方案（Alternatives），供开发者与维护者阅读，确保重要技术选择背后的理由不会随时间丢失。

## 简介

### 什么是 ADR？

架构决策记录（ADR）是一份简短、自包含的笔记，记录单一重要的架构决策：我们面临的问题、做出的选择、选择的原因、付出的代价，以及考虑过的其他方案。ADR 一旦写入即不可变 —— 若决策发生变更，应撰写新的 ADR 来取代旧的。

### 如何新增一条 ADR

1. 选取下一个可用的编号（ADR-009、ADR-010……）。
2. 复制标准模板并填写五个部分。
3. 在下方新增 `## ADR-NNN` 章节。
4. 在"决策索引"表中追加一行。
5. 合并前与团队评审该记录。

每条 ADR 都应基于项目真实的代码与历史，不得虚构代码库中并不存在的架构细节。

---

## 决策索引

| ADR | 主题 | 状态 |
|-----|------|------|
| ADR-001 | 与核心引擎的契约隔离 | 已采纳 |
| ADR-002 | 通过 `CONTRACT_VERSION` 独立版本化 | 已采纳 |
| ADR-003 | 单任务并发执行 | 已采纳 |
| ADR-004 | 基于快照轮询的 WebSocket 进度流 | 已采纳 |
| ADR-005 | 步骤边界的协作式取消 | 已采纳 |
| ADR-006 | 空表单字段表示不覆盖 | 已采纳 |
| ADR-007 | React SPA 作为 FastAPI 下的静态资源 | 已采纳 |
| ADR-008 | Web 技术栈的惰性导入 | 已采纳 |

---

## ADR-001: 与核心引擎的契约隔离

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

movie-narrator-web 是一个独立包，消费核心 `movie_narrator` 引擎。若没有清晰的边界，web 包可能直接导入引擎的内部模块，从而与频繁变动的实现细节耦合，并使版本不匹配难以诊断。

**决策驱动因素**

- web 包需要在不与引擎内部耦合的前提下消费引擎。
- 跨包兼容性需要在加载时可用机器检查。
- 引擎内部独立于 Web UI 演进。

**考虑过的方案**

- 直接导入内部模块（已否决：使 web 包耦合引擎实现细节；引擎 v1.0 的 `format` → `video_format` 重命名足以让此类依赖静默失效）。
- 仅以文档约定边界而不强制（已否决：文档不具约束力；测试中一处孤立的内部导入违反了该规则，并在 v1.0.2 中修复）。

**决策结果**

movie-narrator-web **仅**通过 `movie_narrator.contract` 依赖核心引擎。web 包导入 `build_context`、`run_pipeline`、`PipelineCancelled`、`sanitize_filename`、`check_version`、`list_presets`、`BaseConsole` 与预设注册表 —— 别无其他。导入时执行 `check_version(_MIN_CONTRACT)`，若引擎不兼容则拒绝启动。跨包边界禁止导入内部模块。

**后果**

- 积极：web 包不受引擎内部变更影响；兼容性由机器强制而非寄望；契约边界是唯一、可测试的集成点。
- 消极：web 包只能使用契约暴露的能力；任何新引擎特性必须先加入契约（破坏性变更需递增 `CONTRACT_VERSION`）。

**参考**

- `README.md` → *架构* 章节
- `src/movie_narrator_web/__init__.py`
- `src/movie_narrator_web/tasks.py`
- `CHANGELOG.md`（v1.0.2、v1.1.0）

---

## ADR-002: 通过 `CONTRACT_VERSION` 独立版本化

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

web 包与核心引擎发布节奏不同。若 web 包将版本号与引擎对齐，仅 web 侧的改动就会被迫带动一次令人困惑的引擎版本递增，而版本号相同又会让人误以为两者耦合。

**决策驱动因素**

- web 包与引擎独立发布。
- 兼容性取决于契约暴露的 API 表面，而非版本号是否一致。
- 版本号必须能独立增长，而不暗示虚假的耦合。

**考虑过的方案**

- 将 web 版本与引擎版本对齐（已否决：制造虚假耦合，并让仅 web 侧的改动被迫按引擎编号递增）。
- 完全没有版本契约（已否决：用户可能配错任意版本组合并在运行时失败）。

**决策结果**

movie-narrator-web 使用独立的 `MAJOR.MINOR.PATCH` 版本线。与引擎的兼容性完全由 `CONTRACT_VERSION` 决定：web 包声明最低 `_MIN_CONTRACT`，并在导入时调用 `check_version()`。自 v1.1.0 起，`_MIN_CONTRACT = (1, 0, 0)`，`pyproject.toml` 的依赖下限为 `movie-narrator>=1.0.0`。

**后果**

- 积极：web 与引擎独立版本化；web 版本只反映 web 侧改动；兼容性明确且经检查。
- 消极：用户需理解 web 版本与引擎版本是互不相关的数字；升级 web 包可能需要单独升级引擎。

**参考**

- `src/movie_narrator_web/__init__.py`
- `pyproject.toml`
- `RELEASE_CHECKLIST.md`

---

## ADR-003: 单任务并发执行

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

Web UI 向引擎的 `run_pipeline` 提交解说任务。渲染视频对 CPU 和 GPU 消耗很大，若在一台机器上并发运行多条管线，会争抢资源并使进度上报产生歧义。

**决策驱动因素**

- 渲染消耗资源；并发管线会互相争抢并拖慢彼此。
- 单任务执行使进度与取消语义简单且无歧义。
- 操作者需要从浏览器提交任务，而无需复杂的调度系统。

**考虑过的方案**

- 完全并发的任务池（已否决：对单用户本地 UI 而言资源争抢且进度有歧义）。
- 阻塞 HTTP 请求直至管线完成（已否决：浏览器会挂起，且无法提供进度或取消）。

**决策结果**

`TaskManager` 在 `max_workers=1` 的 `ThreadPoolExecutor` 上运行管线任务。恰好一条管线在运行；后续提交在 executor 中排队。每个任务拥有自己的 `TaskInfo`，内含独立的 `WebSocketConsole` 与 `TaskController`，因此即便执行被串行化，进度与取消仍按单个任务隔离。

**后果**

- 积极：资源使用有界且可预测；进度/取消语义简单；第二次提交自然排队而非让机器过载。
- 消极：运行期间提交的任务需等待当前任务结束；Web UI 内没有优先级或调度。

**参考**

- `src/movie_narrator_web/tasks.py`

---

## ADR-004: 基于快照轮询的 WebSocket 进度流

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

管线在后台线程运行并向控制台写入进度。浏览器需要实时的步骤与日志更新。引擎的控制台协议已发出步骤事件，但 Web UI 需要一种能实时投递、且不把引擎耦合到 HTTP 的传输方式。

**决策驱动因素**

- 实时进度（步骤名与日志文本）必须实时到达浏览器。
- 引擎的控制台协议不得耦合到具体传输（WebSocket 或其他）。
- 客户端断开不得导致管线线程崩溃。

**考虑过的方案**

- 定时轮询 `GET /api/tasks/{id}`（已否决：无实时日志流，且持续轮询浪费）。
- Server-Sent Events（已否决：单向；取消仍需第二个通道）。
- 将引擎控制台直接耦合到 `websocket.send`（已否决：把引擎耦合到特定传输）。

**决策结果**

管线写入线程安全的 `WebSocketConsole`（一个带缓冲的 `BaseConsole` 实现）。WebSocket 端点在循环中轮询 `console.snapshot()`，比较递增的 `version` 计数器，仅在快照变化时推送 `progress` 消息。这使引擎与传输解耦：引擎只写控制台行，端点决定何时推送什么。终止消息携带最终状态、错误、产物列表与视频路径。

**后果**

- 积极：实时、基于增量的进度流；引擎保持与传输无关；断开是安全的，因为端点是对 socket 的唯一写入方。
- 消极：端点轮询控制台而非事件驱动，每个连接引入一个小的轮询循环；控制台在任务生命周期内于内存中缓冲所有行。

**参考**

- `src/movie_narrator_web/console.py`
- `src/movie_narrator_web/ws.py`
- `webui/src/hooks/useWebSocket.ts`

---

## ADR-005: 步骤边界的协作式取消

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

解说管线耗时较长，用户可能希望停止它。粗暴地杀掉线程会破坏输出状态；管线必须在安全点干净地停止。

**决策驱动因素**

- 取消必须干净地停止管线且不破坏部分输出。
- 多种触发路径（REST `DELETE`、WebSocket 取消）必须收敛到同一机制。
- 因管线与 API 运行在不同线程，机制必须是线程安全的。

**考虑过的方案**

- 杀掉工作线程（已否决：不安全 —— 会中断步骤中途、破坏输出）。
- 不加线程安全的裸标志（已否决：API 线程与管线线程之间存在数据竞争）。

**决策结果**

`TaskController` 将 `threading.Event` 包装为协作式取消标志。API 线程调用 `cancel()`；管线线程通过引擎的 `RunController` 协议在步骤边界轮询 `is_cancelled()`。取消时引擎抛出 `PipelineCancelled`，`TaskManager` 将其转换为 `cancelled` 终止状态。REST `DELETE` 与 WebSocket 触发的取消共用同一标志。

**后果**

- 积极：取消干净且线程安全；所有取消入口共享同一机制；部分输出保持一致。
- 消极：取消仅在步骤边界生效，因此单个长步骤可能无法立即停止。

**参考**

- `src/movie_narrator_web/controller.py`
- `src/movie_narrator_web/tasks.py`
- `src/movie_narrator_web/routes.py`
- `src/movie_narrator_web/ws.py`

---

## ADR-006: 空表单字段表示不覆盖

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

web 表单同时暴露基础字段与高级调优参数（场景阈值、匹配分数、翻译重试次数等）。若表单总是注入这些值，留空会以空值或默认值覆盖引擎的 `.env` / `MN_*` 配置，静默遮蔽操作者的基础设施设置。

**决策驱动因素**

- `.env` / `MN_*` 设置是权威的基础设施配置。
- 表单不得意外清空这些设置。
- 高级字段应每次提交时按需参与。

**考虑过的方案**

- 始终将每个表单字段传给 `build_context`（已否决：空值会遮蔽 `.env` / `MN_*` 默认值）。
- 每个高级字段都要求显式开关（已否决：对单用户本地工具而言 UX 臃肿）。

**决策结果**

在 `form_to_context_args` 中，值为 `None` 的高级参数**不**注入 `params` 字典。仅非空表单值会覆盖设置。空字段回退到引擎配置的默认值。注入的 `params` 键保证是引擎 `PARAM_WHITELIST` 的子集。

**后果**

- 积极：除非用户刻意覆盖，否则基础设施默认值得以保留；表单是薄而显式的覆盖层。
- 消极：想在表单中"清空"某设置的用户无法强制空值 —— 清空需直接编辑设置。

**参考**

- `src/movie_narrator_web/form.py`
- `src/movie_narrator_web/models.py`

---

## ADR-007: React SPA 作为 FastAPI 下的静态资源

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

UI 是使用 Vite 与 TypeScript 构建的 React SPA。它需要与 FastAPI 后端同源通信（生产环境无 CORS），并作为单个 Python 包分发。

**决策驱动因素**

- 生产环境中 SPA 与 API 必须同源，因此不需要 CORS。
- 整个产品需作为单个 PyPI wheel 分发，无需独立的前端服务器。
- 开发时 Vite 的 dev server 必须代理到 FastAPI。

**考虑过的方案**

- 从独立静态服务器提供 SPA（已否决：两次部署、需要 CORS、打包更困难）。
- 将 SPA 打包进 Python 包并挂载在 FastAPI 之后（已采纳）。

**决策结果**

构建后的 SPA 落在 `src/movie_narrator_web/static/`（Vite 的 `build.outDir`），并作为包数据包含。FastAPI 以 `html=True` 将该目录挂载到 `/`，提供 `index.html` 与哈希资源。生产环境中 SPA 与 `/api/*` 端点同源。开发时 Vite 运行在 `:5173`，将 `/api` 与 `/ws` 代理到 FastAPI，CORS 仅对 dev 源开放。

**后果**

- 积极：生产同源（无 CORS）、单一 wheel、无需运营第二个服务器；dev 代理保持清晰分离。
- 消极：打包前必须重新构建 SPA；挂载在 `/` 意味着任何未匹配 API 路由的路径都会回退到 SPA。

**参考**

- `src/movie_narrator_web/server.py`
- `webui/vite.config.ts`
- `pyproject.toml`（`[tool.setuptools.package-data]`）

---

## ADR-008: Web 技术栈的惰性导入

- **状态：** 已采纳
- **版本：** 自初始发布（v1.0.1）起生效

**背景**

`import movie_narrator_web` 会触发契约版本检查。若导入包的同时也导入 `fastapi`、`uvicorn` 与 `python-multipart`，则仅导入包就需要完整的 web 技术栈。web 包是独立安装，因此只想检查兼容性或版本号的用户不应需要 web 技术栈存在。

**决策驱动因素**

- 导入包应在未安装 web 运行时的情况下可用。
- 重量级 web 依赖只在实际启动服务器时才需要。
- 契约检查仍须在导入时立即执行。

**考虑过的方案**

- 在包顶层导入 `fastapi`/`uvicorn`（已否决：导入包就需要完整 web 技术栈）。
- 一切延迟到 CLI 入口（已否决：包本身仍应在引擎不兼容时快速失败）。

**决策结果**

包体只导入契约检查（`movie_narrator.contract`）。`fastapi`、`uvicorn` 与 app 工厂在 `launch_web_api()` 内惰性导入。因此 `pip install movie-narrator-web` 与 `import movie_narrator_web` 在无 web 运行时下也能工作，而 `mn-web` 命令仅在启动时才引入完整技术栈。

**后果**

- 积极：无需 web 技术栈即可导入与检查版本；契约检查仍在导入时立即执行。
- 消极：首次 `mn-web` 启动需惰性承担导入成本；web 技术栈的错误在启动时而非导入时暴露。

**参考**

- `src/movie_narrator_web/__init__.py`
- `pyproject.toml`