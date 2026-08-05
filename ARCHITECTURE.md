[![English](https://img.shields.io/badge/English-Architecture-blue)](ARCHITECTURE.md)
[![简体中文](https://img.shields.io/badge/简体中文-架构-green)](ARCHITECTURE.zh-CN.md)

# Architecture

> **This document describes the `movie-narrator-web` package** — the FastAPI +
> React SPA front end for the core `movie-narrator` engine. The engine itself is
> a separate package; its own architecture is documented in the core
> repository's `docs/ARCHITECTURE.md`. This document covers how the web UI
> consumes the engine through the contract layer and how its own components fit
> together.

## Component Overview

```text
┌────────────────────────────────────────────────────────────────┐
│                       Browser (React SPA)                      │
│   CreatePanel · MonitorPanel · ResultPanel · LogStream        │
│   ProgressTimeline · sections · i18n (zh/en)                  │
│        │                     ▲                                │
│        │ REST (fetch)        │ WebSocket (/ws/task/{id})      │
│        ▼                     │                                │
┌────────────────────────────────────────────────────────────────┐
│                    FastAPI (movie_narrator_web)                │
│                                                               │
│  server.py ── create_app() ── factory ── static/ + CORS       │
│  routes.py ── REST API (/api/tasks, /api/artifacts, /api/video)│
│  ws.py ───── WebSocket endpoint (progress + cancel)           │
│  tasks.py ─── TaskManager → ThreadPoolExecutor(max_workers=1) │
│  models.py ── Pydantic request/response models                │
│  form.py ──── validation + form_to_context_args()             │
│  console.py ─ WebSocketConsole (buffered BaseConsole)         │
│  controller.py ─ TaskController (cooperative cancel)          │
│  utils.py ─── uploads · collect_artifacts · zip               │
└──────────────┬─────────────────────────────────────────────────┘
               │ movie_narrator.contract (sole boundary)
               ▼
┌────────────────────────────────────────────────────────────────┐
│              Core engine (movie_narrator)                      │
│   build_context · run_pipeline · PipelineCancelled            │
│   sanitize_filename · check_version · list_presets            │
│   BaseConsole · PARAM_WHITELIST · RunController               │
└────────────────────────────────────────────────────────────────┘
```

- **Frontend** (`webui/`) — React + TypeScript + Vite + Tailwind + shadcn/ui SPA. Built output lands in `src/movie_narrator_web/static/`.
- **Backend** (`src/movie_narrator_web/`) — FastAPI application that owns the HTTP/WebSocket boundary, runs the engine pipeline in a background thread, and streams progress back.
- **Contract** (`movie_narrator.contract`) — the single import surface into the core engine. The web package imports nothing else from the engine.

## Backend

The backend is a FastAPI application built by a factory function. All web-specific logic lives in `movie_narrator_web`; all pipeline logic is delegated to the engine.

### Application factory (`server.py`)

`create_app()` assembles the app:

- Registers CORS middleware, open **only** for the Vite dev origin (`localhost:5173` / `127.0.0.1:5173`).
- Creates the `TaskManager` and the upload directory (`output/_uploads`).
- Mounts the REST router (`/api`), the WebSocket endpoint (`/ws/task/{task_id}`), and a health check (`GET /api/health`).
- Mounts the built SPA at `/` (`html=True`) when `static/` exists, so production serves the UI and API from one origin.

`launch_web_api()` (in `__init__.py`) imports `fastapi`/`uvicorn` lazily and starts the server. The `mn-web` console script calls `movie_narrator_web:main`, which parses `--host`, `--port`, and `--reload`.

### Task lifecycle (`tasks.py`)

`TaskManager` serializes pipeline execution through a `ThreadPoolExecutor(max_workers=1)`:

```text
POST /api/tasks
   │  validate_form() → FormData
   ▼
TaskManager.create_task(request, video_path, bgm_path)
   │  output_dir = output/<movie>/<task_id>
   │  TaskInfo(task_id, output_dir)  →  WebSocketConsole + TaskController
   ▼
_executor.submit(_run_task, ...)   # background thread
   │
   │  build_context(**form_to_context_args(form_data))
   │  ctx.services.console = info.console
   │  run_pipeline(ctx, controller=info.controller)
   │
   ├─ done        → collect_artifacts(), set_terminal("done")
   ├─ cancelled   → PipelineCancelled → set_terminal("cancelled")
   └─ failed      → set_terminal("failed", traceback)
```

Each `TaskInfo` holds its own console and controller, so progress and cancellation are scoped per task even though execution is serialized. Uploaded source files are deleted best-effort after the task reaches a terminal state.

### Task status model

A task transitions through `running → done | failed | cancelled`. `TaskInfo.to_status_dict()` derives `current_step` from the console snapshot (the pipeline updates it via `console.step()`), and carries `error`, `artifacts`, and `video_path`.

## REST API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/tasks` | Create a task (multipart form + optional `video`/`bgm` uploads) |
| GET | `/api/tasks/{id}` | Get task status |
| DELETE | `/api/tasks/{id}` | Cancel a running task |
| GET | `/api/artifacts/{id}` | Download artifacts (single file, or zip when multiple) |
| GET | `/api/video/{id}` | Stream the output video for inline playback |
| GET | `/api/health` | Health check |

Form fields are validated twice: the Pydantic `TaskCreateRequest` model enforces ranges and patterns, and `validate_form()` enforces cross-field rules (for example, `subtitle_lang` is required when `subtitle_mode` is `translated` or `bilingual`). Invalid submissions return HTTP 422.

Uploads are streamed to `output/_uploads` with size limits (video 2 GB, BGM 50 MB) and extension whitelists. Filenames are stripped of directory components to prevent path traversal.

## WebSocket Protocol

The WebSocket endpoint (`/ws/task/{task_id}`) streams live progress and accepts cancellation. The client sends a `subscribe` action on open and may send a `cancel` action at any time.

```text
Client ──subscribe──────────────▶ Server
Server ──progress {step, version, log}──▶ Client   (only when snapshot changed)
Server ──terminal {status, error, artifacts, video_path}──▶ Client   (once, at the end)
```

The engine is decoupled from the transport: the pipeline writes to a thread-safe `WebSocketConsole`, and the endpoint polls `console.snapshot()` comparing a monotonically increasing `version`. When the task reaches a terminal state, the endpoint sends one `terminal` message and closes. The frontend teardown is driven by the task status — the WebSocket stays active only while `status === "running"`.

## Frontend

The SPA is organized around a single `TaskContext` provided by `App.tsx`:

- **`App.tsx`** — owns task state (status, current step, log, artifacts, error, video path), wires `useWebSocket`, and exposes `startTask` / `resetTask` / `cancelTask`.
- **`hooks/useWebSocket.ts`** — connects to `/ws/task/{id}`, auto-reconnects up to 3 times, and dispatches parsed messages to the app.
- **`hooks/useTask.ts`** — context accessor hook.
- **`lib/api.ts`** — thin `fetch` wrappers for task creation, status, cancel, artifact/video URLs, and the WebSocket URL.
- **`i18n/`** — lightweight zh/en translation (React Context + typed message dictionaries, no extra dependency). The UI language is sent to the backend as `lang` so the pipeline can produce narration in the selected language.
- **`types/index.ts`** — shared types plus the `PIPELINE_STEPS` timeline (mirrors the engine's `STEPS` list) and the `NARRATION_PRESETS` list.

### Components

| Component | Role |
|-----------|------|
| `CreatePanel` | The submission form; groups inputs into `MovieSection`, `VoiceSection`, `SubtitlesSection`, `AdvancedSection`, `AssetsSection`, `PresetSection` |
| `MonitorPanel` | Live view while a task runs; hosts `ProgressTimeline`, `LogStream`, `ResultPanel` |
| `ProgressTimeline` | Step-by-step progress derived from `PIPELINE_STEPS` |
| `LogStream` | Scrolling console log fed by WebSocket `progress` messages |
| `ResultPanel` | Terminal state: video player, artifact download, error display |
| `Header` / `Footer` | Shell chrome; Header hosts the language switcher |

## Contract Boundary

The web package consumes the core engine **only** through `movie_narrator.contract`:

```text
movie-narrator-web  →  movie_narrator.contract
                              ├── build_context / run_pipeline
                              ├── PipelineCancelled
                              ├── sanitize_filename / check_version
                              ├── list_presets
                              ├── BaseConsole / RunController
                              └── PARAM_WHITELIST
```

`__init__.py` runs `check_version(_MIN_CONTRACT)` at import time with `_MIN_CONTRACT = (1, 0, 0)`, refusing to start against an incompatible engine. The dependency floor in `pyproject.toml` is `movie-narrator>=1.0.0`. The web package never imports an engine internal module.

### Form → context mapping

`form_to_context_args()` maps validated form data to `build_context` keyword arguments. The engine's v1.0 rename of `format` → `video_format` is handled here: the web API keeps `format` as its HTTP field name (frontend/API compatibility) and maps it to `video_format` internally. Advanced parameters with `None` values are not injected into `params`, so engine `.env` / `MN_*` settings remain authoritative.

## Key Design Rules

- **No second implementation**: the web package calls `build_context` + `run_pipeline` — the same entry points the CLI uses. It never re-implements pipeline logic.
- **Contract is the sole boundary**: only `movie_narrator.contract` is imported; compatibility is enforced at import time by `check_version`.
- **Single concurrent task**: `max_workers=1` serializes pipeline execution; queued submissions wait their turn.
- **Transport-agnostic console**: the engine writes to a buffered `BaseConsole`; the WebSocket endpoint decides what and when to push.
- **Cooperative cancel**: `TaskController` (a `threading.Event`) is polled at step boundaries; cancellation surfaces as a `cancelled` terminal state.
- **Empty = no override**: blank advanced form fields do not enter `params`, so Settings defaults apply.
- **Uploads to a stable dir**: uploaded files go to `output/_uploads`, never ad-hoc temp dirs or the movie output folder.
- **Independent versioning**: the web package version is unrelated to the engine version; compatibility is governed by `CONTRACT_VERSION`.

## Extension Points

- **New form field**: add it to `FormData` / `validate_form` / `form_to_context_args` in `form.py`, the Pydantic model in `models.py`, the route parameter in `routes.py`, and the frontend `FormSubmitData` in `types/index.ts`. Any new `params` key must exist in the engine's `PARAM_WHITELIST`.
- **New engine capability**: it must be exposed through `movie_narrator.contract` (bump `CONTRACT_VERSION` when breaking) before the web package can use it.
- **New UI section**: add a component under `webui/src/components/` and compose it into `CreatePanel` or `MonitorPanel`; wire any new strings through the `i18n` dictionaries.
- **Artifact types**: extend `collect_artifacts()` in `utils.py` to include new output files produced by the pipeline.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Contract-only imports | Decouples the web package from engine internals; v1.0 engine renames cannot break it silently |
| Independent versioning via `CONTRACT_VERSION` | Web and engine release independently; compatibility is machine-checked, not inferred from numbers |
| `max_workers=1` | Rendering is resource-intensive; serialized execution keeps progress and cancel unambiguous |
| WebSocket snapshot polling | Live delta streaming without coupling the engine to a transport |
| Cooperative cancel flag | Thread-safe, clean stop at step boundaries; REST and WS cancels share one mechanism |
| Empty = no override | The form never shadows `.env` / `MN_*` infrastructure settings |
| SPA served as static assets | Single origin in production, single wheel, no separate frontend server |
| Lazy web imports | `import movie_narrator_web` works without the web runtime installed |