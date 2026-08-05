[![English](https://img.shields.io/badge/English-Architecture-blue)](ARCHITECTURE.md)
[![简体中文](https://img.shields.io/badge/简体中文-架构-green)](ARCHITECTURE.zh-CN.md)

# 架构

> **本文档描述 `movie-narrator-web` 包** —— 核心 `movie-narrator` 引擎的
> FastAPI + React SPA 前端。引擎本身是独立包，其架构在核心仓库的
> `docs/ARCHITECTURE.md` 中说明。本文档聚焦 Web UI 如何通过契约层消费引擎，
> 以及其自身组件如何协同。

## 组件总览

```text
┌────────────────────────────────────────────────────────────────┐
│                      浏览器（React SPA）                        │
│   CreatePanel · MonitorPanel · ResultPanel · LogStream        │
│   ProgressTimeline · sections · i18n（中/英）                 │
│        │                     ▲                                │
│        │ REST (fetch)        │ WebSocket (/ws/task/{id})      │
│        ▼                     │                                │
┌────────────────────────────────────────────────────────────────┐
│                    FastAPI（movie_narrator_web）               │
│                                                               │
│  server.py ── create_app() ── 工厂 ── static/ + CORS          │
│  routes.py ── REST API (/api/tasks, /api/artifacts, /api/video)│
│  ws.py ───── WebSocket 端点（进度 + 取消）                    │
│  tasks.py ─── TaskManager → ThreadPoolExecutor(max_workers=1) │
│  models.py ── Pydantic 请求/响应模型                          │
│  form.py ──── 校验 + form_to_context_args()                   │
│  console.py ─ WebSocketConsole（带缓冲的 BaseConsole）         │
│  controller.py ─ TaskController（协作式取消）                  │
│  utils.py ─── 上传 · collect_artifacts · zip                  │
└──────────────┬─────────────────────────────────────────────────┘
               │ movie_narrator.contract（唯一边界）
               ▼
┌────────────────────────────────────────────────────────────────┐
│              核心引擎（movie_narrator）                        │
│   build_context · run_pipeline · PipelineCancelled            │
│   sanitize_filename · check_version · list_presets            │
│   BaseConsole · PARAM_WHITELIST · RunController               │
└────────────────────────────────────────────────────────────────┘
```

- **前端**（`webui/`）—— 基于 React + TypeScript + Vite + Tailwind + shadcn/ui 的 SPA。构建产物落在 `src/movie_narrator_web/static/`。
- **后端**（`src/movie_narrator_web/`）—— FastAPI 应用，负责 HTTP/WebSocket 边界，在后台线程运行引擎管线并回传进度。
- **契约**（`movie_narrator.contract`）—— 进入核心引擎的唯一导入表面。web 包不导入引擎的任何其他内容。

## 后端

后端是工厂函数构建的 FastAPI 应用。所有 web 专属逻辑位于 `movie_narrator_web`；所有管线逻辑委托给引擎。

### 应用工厂（`server.py`）

`create_app()` 组装应用：

- 注册 CORS 中间件，**仅**对 Vite dev 源开放（`localhost:5173` / `127.0.0.1:5173`）。
- 创建 `TaskManager` 与上传目录（`output/_uploads`）。
- 挂载 REST 路由器（`/api`）、WebSocket 端点（`/ws/task/{task_id}`）与健康检查（`GET /api/health`）。
- 当 `static/` 存在时以 `html=True` 将构建后的 SPA 挂载到 `/`，使生产环境同源提供 UI 与 API。

`launch_web_api()`（位于 `__init__.py`）惰性导入 `fastapi`/`uvicorn` 并启动服务器。`mn-web` 控制台脚本调用 `movie_narrator_web:main`，解析 `--host`、`--port` 与 `--reload`。

### 任务生命周期（`tasks.py`）

`TaskManager` 通过 `ThreadPoolExecutor(max_workers=1)` 串行化管线执行：

```text
POST /api/tasks
   │  validate_form() → FormData
   ▼
TaskManager.create_task(request, video_path, bgm_path)
   │  output_dir = output/<movie>/<task_id>
   │  TaskInfo(task_id, output_dir)  →  WebSocketConsole + TaskController
   ▼
_executor.submit(_run_task, ...)   # 后台线程
   │
   │  build_context(**form_to_context_args(form_data))
   │  ctx.services.console = info.console
   │  run_pipeline(ctx, controller=info.controller)
   │
   ├─ done        → collect_artifacts(), set_terminal("done")
   ├─ cancelled   → PipelineCancelled → set_terminal("cancelled")
   └─ failed      → set_terminal("failed", traceback)
```

每个 `TaskInfo` 拥有独立的 console 与 controller，因此即便执行被串行化，进度与取消仍按单个任务隔离。任务到达终止状态后，上传的源文件会尽力删除。

### 任务状态模型

任务经历 `running → done | failed | cancelled`。`TaskInfo.to_status_dict()` 从 console 快照推导 `current_step`（管线通过 `console.step()` 更新），并携带 `error`、`artifacts` 与 `video_path`。

## REST API

| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/tasks` | 创建任务（multipart 表单 + 可选 `video`/`bgm` 上传） |
| GET | `/api/tasks/{id}` | 获取任务状态 |
| DELETE | `/api/tasks/{id}` | 取消运行中的任务 |
| GET | `/api/artifacts/{id}` | 下载产物（单文件，或多个时打包 zip） |
| GET | `/api/video/{id}` | 流式输出视频用于内嵌播放 |
| GET | `/api/health` | 健康检查 |

表单字段经过双重校验：Pydantic `TaskCreateRequest` 模型强制范围与模式，`validate_form()` 强制跨字段规则（例如当 `subtitle_mode` 为 `translated` 或 `bilingual` 时 `subtitle_lang` 必填）。非法提交返回 HTTP 422。

上传通过流式写入 `output/_uploads`，带大小限制（视频 2 GB、BGM 50 MB）与扩展名白名单。文件名去除目录成分以防路径穿越。

## WebSocket 协议

WebSocket 端点（`/ws/task/{task_id}`）流式实时进度并接受取消。客户端在打开时发送 `subscribe` 动作，可随时发送 `cancel` 动作。

```text
客户端 ──subscribe──────────────▶ 服务端
服务端 ──progress {step, version, log}──▶ 客户端   （仅当快照变化时）
服务端 ──terminal {status, error, artifacts, video_path}──▶ 客户端   （结束时一次）
```

引擎与传输解耦：管线写入线程安全的 `WebSocketConsole`，端点轮询 `console.snapshot()` 并比较单调递增的 `version`。任务到达终止状态时，端点发送一次 `terminal` 消息并关闭。前端拆除由任务状态驱动 —— 仅当 `status === "running"` 时 WebSocket 保持活跃。

## 前端

SPA 围绕 `App.tsx` 提供的单一 `TaskContext` 组织：

- **`App.tsx`** —— 持有任务状态（状态、当前步骤、日志、产物、错误、视频路径），接入 `useWebSocket`，暴露 `startTask` / `resetTask` / `cancelTask`。
- **`hooks/useWebSocket.ts`** —— 连接 `/ws/task/{id}`，最多自动重连 3 次，并将解析后的消息派发给应用。
- **`hooks/useTask.ts`** —— 上下文访问钩子。
- **`lib/api.ts`** —— 任务创建、状态、取消、产物/视频 URL 与 WebSocket URL 的薄 `fetch` 封装。
- **`i18n/`** —— 轻量中/英翻译（React Context + 类型化消息字典，无额外依赖）。UI 语言作为 `lang` 传给后端，使管线能用所选语言生成解说。
- **`types/index.ts`** —— 共享类型，外加 `PIPELINE_STEPS` 时间线（镜像引擎的 `STEPS` 列表）与 `NARRATION_PRESETS` 列表。

### 组件

| 组件 | 职责 |
|------|------|
| `CreatePanel` | 提交表单；将输入分组为 `MovieSection`、`VoiceSection`、`SubtitlesSection`、`AdvancedSection`、`AssetsSection`、`PresetSection` |
| `MonitorPanel` | 任务运行时的实时视图；承载 `ProgressTimeline`、`LogStream`、`ResultPanel` |
| `ProgressTimeline` | 基于 `PIPELINE_STEPS` 的逐步进度 |
| `LogStream` | 由 WebSocket `progress` 消息驱动的滚动控制台日志 |
| `ResultPanel` | 终止状态：视频播放器、产物下载、错误展示 |
| `Header` / `Footer` | 外壳；`Header` 承载语言切换器 |

## 契约边界

web 包**仅**通过 `movie_narrator.contract` 消费核心引擎：

```text
movie-narrator-web  →  movie_narrator.contract
                              ├── build_context / run_pipeline
                              ├── PipelineCancelled
                              ├── sanitize_filename / check_version
                              ├── list_presets
                              ├── BaseConsole / RunController
                              └── PARAM_WHITELIST
```

`__init__.py` 在导入时以 `_MIN_CONTRACT = (1, 0, 0)` 执行 `check_version(_MIN_CONTRACT)`，若引擎不兼容则拒绝启动。`pyproject.toml` 的依赖下限为 `movie-narrator>=1.0.0`。web 包从不导入引擎内部模块。

### 表单 → 上下文映射

`form_to_context_args()` 将校验后的表单数据映射为 `build_context` 关键字参数。引擎 v1.0 将 `format` 重命名为 `video_format`，在此处处理：web API 保留 `format` 作为其 HTTP 字段名（前端/API 兼容），内部映射为 `video_format`。值为 `None` 的高级参数不注入 `params`，因此引擎的 `.env` / `MN_*` 设置保持权威。

## 关键设计规则

- **无第二实现**：web 包调用 `build_context` + `run_pipeline` —— 与 CLI 相同的入口，绝不重实现管线逻辑。
- **契约是唯一边界**：只导入 `movie_narrator.contract`；兼容性在导入时由 `check_version` 强制。
- **单任务并发**：`max_workers=1` 串行化管线执行；排队提交按序等待。
- **与控制台传输无关**：引擎写入带缓冲的 `BaseConsole`；WebSocket 端点决定推送什么、何时推送。
- **协作式取消**：`TaskController`（一个 `threading.Event`）在步骤边界被轮询；取消表现为 `cancelled` 终止状态。
- **空 = 不覆盖**：空白的高级表单字段不进入 `params`，因此应用设置默认值。
- **上传到稳定目录**：上传文件进入 `output/_uploads`，绝不进入临时目录或电影输出目录。
- **独立版本化**：web 包版本与引擎版本无关；兼容性由 `CONTRACT_VERSION` 决定。

## 扩展点

- **新增表单字段**：在 `form.py` 的 `FormData` / `validate_form` / `form_to_context_args`、`models.py` 的 Pydantic 模型、`routes.py` 的路由参数以及 `types/index.ts` 的前端 `FormSubmitData` 中新增。任何新的 `params` 键必须存在于引擎的 `PARAM_WHITELIST`。
- **新增引擎能力**：在 web 包使用前，必须先通过 `movie_narrator.contract` 暴露（破坏性变更需递增 `CONTRACT_VERSION`）。
- **新增 UI 区块**：在 `webui/src/components/` 下新增组件，并组合进 `CreatePanel` 或 `MonitorPanel`；新字符串通过 `i18n` 字典接入。
- **产物类型**：扩展 `utils.py` 中的 `collect_artifacts()`，以包含管线产生的新输出文件。

## 关键设计决策

| 决策 | 理由 |
|------|------|
| 仅契约导入 | 使 web 包与引擎内部解耦；v1.0 引擎重命名不会静默破坏它 |
| 通过 `CONTRACT_VERSION` 独立版本化 | web 与引擎独立发布；兼容性由机器检查而非从数字推断 |
| `max_workers=1` | 渲染消耗资源；串行化执行使进度与取消无歧义 |
| WebSocket 快照轮询 | 实时增量流而不把引擎耦合到传输 |
| 协作式取消标志 | 线程安全、步骤边界干净停止；REST 与 WS 取消共享同一机制 |
| 空 = 不覆盖 | 表单绝不遮蔽 `.env` / `MN_*` 基础设施设置 |
| SPA 作为静态资源 | 生产同源、单一 wheel、无需独立前端服务器 |
| Web 栈惰性导入 | `import movie_narrator_web` 在未安装 web 运行时下也可用 |