[![English](https://img.shields.io/badge/English-ADR-blue)](ADR.md)
[![简体中文](https://img.shields.io/badge/简体中文-架构决策记录-green)](ADR.zh-CN.md)

# Architecture Decision Records

This document records the key architecture decisions made for the **movie-narrator-web** project. Each ADR follows a standard structure — Status, Context, Decision, Consequences, and Alternatives — and is intended to be read by developers and maintainers so that the rationale behind important technical choices is not lost over time.

## Introduction

### What is an ADR?

An Architecture Decision Record (ADR) is a short, self-contained note that captures a single significant architectural decision: the problem we were facing, the choice we made, why we made it, what it costs us, and what we considered instead. ADRs are immutable once written — if a decision changes, a new ADR is written that supersedes the old one.

### How to add a new ADR

1. Pick the next available number (ADR-009, ADR-010, ...).
2. Open a copy of the standard template and fill in the five sections.
3. Add a `## ADR-NNN` section below.
4. Append a row to the "Decision Index" table.
5. Review the record with the team before merging.

Each ADR should be grounded in the project's actual code and history. Do not invent architecture details that do not exist in the codebase.

---

## Decision Index

| ADR | Topic | Status |
|-----|-------|--------|
| ADR-001 | Contract isolation from the core engine | Accepted |
| ADR-002 | Independent versioning via `CONTRACT_VERSION` | Accepted |
| ADR-003 | Single concurrent task execution | Accepted |
| ADR-004 | WebSocket progress streaming over snapshot polling | Accepted |
| ADR-005 | Cooperative cancellation at step boundaries | Accepted |
| ADR-006 | Empty form fields mean no override | Accepted |
| ADR-007 | React SPA served as static assets behind FastAPI | Accepted |
| ADR-008 | Lazy imports for the web stack | Accepted |

---

## ADR-001: Contract Isolation from the Core Engine

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

movie-narrator-web is a separate package that consumes the core `movie_narrator` engine. Without a clear boundary, the web package could import the engine's internal modules directly, tying it to implementation details that change frequently and making version mismatches hard to diagnose.

**Decision Drivers**

- The web package needed to consume the engine without coupling to its internals.
- Cross-package compatibility needed to be machine-checkable at load time.
- The engine's internals evolve independently of the web UI.

**Considered Options**

- Importing internal modules directly (rejected: couples the web package to engine implementation details; the engine's v1.0 `format` → `video_format` rename alone would have broken any such dependency silently).
- Documenting the boundary but leaving imports unenforced (rejected: documentation is not enforced; a single stray internal import in tests violated the rule and had to be fixed in v1.0.2).

**Decision Outcome**

movie-narrator-web depends on the core engine **only** through `movie_narrator.contract`. The web package imports `build_context`, `run_pipeline`, `PipelineCancelled`, `sanitize_filename`, `check_version`, `list_presets`, `BaseConsole`, and the preset registry — nothing else. A `check_version(_MIN_CONTRACT)` call at import time refuses to start against an incompatible engine. Internal module imports are prohibited across the package boundary.

**Consequences**

- Positive: the web package survives engine internals changing; compatibility is enforced, not hoped for; the contract boundary is the single, testable integration point.
- Negative: the web package can only use capabilities the contract exposes; any new engine feature must be added to the contract first (with a `CONTRACT_VERSION` bump when breaking).

**References**

- `README.md` → *Architecture* section
- `src/movie_narrator_web/__init__.py`
- `src/movie_narrator_web/tasks.py`
- `CHANGELOG.md` (v1.0.2, v1.1.0)

---

## ADR-002: Independent Versioning via `CONTRACT_VERSION`

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

The web package and the core engine are released at different cadences. If the web package aligned its version numbers with the engine's, a web-only change would force a confusing engine-version bump, and matching numbers would falsely imply the versions are coupled.

**Decision Drivers**

- The web package and the engine release independently.
- Compatibility depends on the API surface the contract exposes, not on matching package versions.
- Version numbers must be able to grow independently without implying a false coupling.

**Considered Options**

- Aligning the web version with the engine version (rejected: creates a false coupling and forces engine-numbered bumps for web-only changes).
- No version contract at all (rejected: users could pair any web version with any engine version and fail at runtime).

**Decision Outcome**

movie-narrator-web uses its own independent `MAJOR.MINOR.PATCH` version line. Compatibility with the engine is governed solely by `CONTRACT_VERSION`: the web package declares a minimum `_MIN_CONTRACT` and calls `check_version()` at import time. As of v1.1.0, `_MIN_CONTRACT = (1, 0, 0)` and the dependency floor in `pyproject.toml` is `movie-narrator>=1.0.0`.

**Consequences**

- Positive: web and engine version independently; the web version reflects web changes only; compatibility is explicit and checked.
- Negative: users must understand that the web version and the engine version are unrelated numbers; upgrading the web package may require a separate engine upgrade.

**References**

- `src/movie_narrator_web/__init__.py`
- `pyproject.toml`
- `RELEASE_CHECKLIST.md`

---

## ADR-003: Single Concurrent Task Execution

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

The web UI submits narration jobs to the engine's `run_pipeline`. Rendering a video is CPU- and GPU-intensive, and running several pipelines concurrently on one machine would contend for resources and make progress reporting ambiguous.

**Decision Drivers**

- Rendering is resource-intensive; concurrent pipelines would contend and slow each other down.
- A single task at a time keeps progress and cancellation semantics simple and unambiguous.
- Operators need to submit jobs from the browser without a complex scheduling system.

**Considered Options**

- A fully concurrent task pool (rejected: resource contention and ambiguous progress for a single-user local UI).
- Blocking the HTTP request until the pipeline finishes (rejected: the browser would hang and offer no progress or cancellation).

**Decision Outcome**

`TaskManager` runs pipeline jobs on a `ThreadPoolExecutor` with `max_workers=1`. Exactly one pipeline runs at a time; further submissions queue in the executor. Each task gets a `TaskInfo` with its own `WebSocketConsole` and `TaskController`, so progress and cancellation are scoped to the individual task even though execution is serialized.

**Consequences**

- Positive: resource usage is bounded and predictable; progress/cancel semantics are simple; a second submission naturally queues instead of thrashing the machine.
- Negative: jobs submitted while one is running wait until the current job finishes; there is no priority or scheduling within the web UI.

**References**

- `src/movie_narrator_web/tasks.py`

---

## ADR-004: WebSocket Progress Streaming over Snapshot Polling

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

The pipeline runs in a background thread and writes progress to a console. The browser needs live step and log updates. The pipeline's console protocol already emits step events, but the web UI needed a transport that delivers them in real time without coupling the engine to HTTP.

**Decision Drivers**

- Live progress (step name and log text) must reach the browser in real time.
- The engine's console protocol must not be coupled to the transport (WebSocket vs. something else).
- Client disconnects must not crash the pipeline thread.

**Considered Options**

- Polling `GET /api/tasks/{id}` on a timer (rejected: no live log streaming, and constant polling is wasteful).
- Server-Sent Events (rejected: unidirectional; cancellation still needs a second channel).
- Directly coupling the engine console to `websocket.send` (rejected: couples the engine to a specific transport).

**Decision Outcome**

The pipeline writes to a thread-safe `WebSocketConsole` (a buffered `BaseConsole` implementation). The WebSocket endpoint polls `console.snapshot()` on a loop, comparing an incrementing `version` counter, and pushes a `progress` message only when the snapshot changed. This decouples the engine from the transport: the engine just writes console lines, and the endpoint decides when and what to push. A terminal message carries final status, error, artifacts, and video path.

**Consequences**

- Positive: live, delta-based progress streaming; the engine remains transport-agnostic; disconnects are safe because the endpoint is the only writer to the socket.
- Negative: the endpoint polls the console rather than being event-driven, which adds a small polling loop per connected client; the console buffers all lines in memory for the lifetime of a task.

**References**

- `src/movie_narrator_web/console.py`
- `src/movie_narrator_web/ws.py`
- `webui/src/hooks/useWebSocket.ts`

---

## ADR-005: Cooperative Cancellation at Step Boundaries

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

A narration pipeline is long-running, and the user may want to stop it. Abruptly killing the thread would corrupt output state; the pipeline must be able to stop cleanly at a safe point.

**Decision Drivers**

- Cancellation must stop the pipeline cleanly without corrupting partial output.
- Multiple trigger paths (REST `DELETE`, WebSocket cancel) must converge on one mechanism.
- The mechanism must be thread-safe because the pipeline and the API run on different threads.

**Considered Options**

- Killing the worker thread (rejected: unsafe — interrupts mid-step, corrupts output).
- A bare flag without thread-safety (rejected: data race between the API thread and the pipeline thread).

**Decision Outcome**

`TaskController` wraps a `threading.Event` as a cooperative cancel flag. The API thread calls `cancel()`; the pipeline thread polls `is_cancelled()` at step boundaries via the engine's `RunController` protocol. On cancellation, the engine raises `PipelineCancelled`, which `TaskManager` translates into a `cancelled` terminal state. The same flag is passed for both REST `DELETE` and WebSocket-triggered cancels.

**Consequences**

- Positive: cancellation is clean and thread-safe; all cancel entry points share one mechanism; partial output stays consistent.
- Negative: cancellation only takes effect at step boundaries, so a long single step may not stop immediately.

**References**

- `src/movie_narrator_web/controller.py`
- `src/movie_narrator_web/tasks.py`
- `src/movie_narrator_web/routes.py`
- `src/movie_narrator_web/ws.py`

---

## ADR-006: Empty Form Fields Mean No Override

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

The web form exposes both basic fields and advanced tuning parameters (scene threshold, match score, translate retries, and so on). If the form always injected these values, leaving them blank would override the engine's `.env` / `MN_*` configuration with empty or default values, silently shadowing operator infrastructure settings.

**Decision Drivers**

- `.env` / `MN_*` settings are the authoritative infrastructure configuration.
- The form must not accidentally blank out those settings.
- Advanced fields should be opt-in per submission.

**Considered Options**

- Always passing every form field to `build_context` (rejected: empty values would shadow `.env` / `MN_*` defaults).
- Requiring an explicit toggle per advanced field (rejected: cluttered UX for a single-user local tool).

**Decision Outcome**

Advanced parameters with `None` values are **not** injected into the `params` dict in `form_to_context_args`. Only non-empty form values override Settings. Empty fields fall through to the engine's configured defaults. The `params` keys injected are guaranteed to be a subset of the engine's `PARAM_WHITELIST`.

**Consequences**

- Positive: infrastructure defaults are preserved unless the user deliberately overrides them; the form is a thin, explicit override layer.
- Negative: a user who wants to "clear" a setting via the form cannot force an empty value — clearing requires editing settings directly.

**References**

- `src/movie_narrator_web/form.py`
- `src/movie_narrator_web/models.py`

---

## ADR-007: React SPA Served as Static Assets behind FastAPI

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

The UI is a React SPA built with Vite and TypeScript. It needs to talk to the FastAPI backend over the same origin (no CORS in production) and be distributable as a single Python package.

**Decision Drivers**

- The SPA and the API must share one origin in production so no CORS is needed.
- The whole thing must ship as one PyPI wheel with no separate frontend server.
- During development, Vite's dev server must proxy to FastAPI.

**Considered Options**

- Serving the SPA from a separate static server (rejected: two deployments, CORS needed, harder to package).
- Bundling the SPA into the Python package and mounting it behind FastAPI (chosen).

**Decision Outcome**

The built SPA lands in `src/movie_narrator_web/static/` (Vite's `build.outDir`) and is included as package data. FastAPI mounts this directory at `/` with `html=True`, serving `index.html` and hashed assets. In production the SPA and `/api/*` endpoints share one origin. In development, Vite runs on `:5173` and proxies `/api` and `/ws` to FastAPI, with CORS allowed only for the dev origin.

**Consequences**

- Positive: single-origin production (no CORS), single wheel, no second server to operate; the dev proxy keeps a clean separation.
- Negative: rebuilding the SPA is a required step before packaging; the static mount at `/` means any path not matched by an API route falls through to the SPA.

**References**

- `src/movie_narrator_web/server.py`
- `webui/vite.config.ts`
- `pyproject.toml` (`[tool.setuptools.package-data]`)

---

## ADR-008: Lazy Imports for the Web Stack

- **Status:** Accepted
- **Version:** In force since the initial release (v1.0.1)

**Context**

`import movie_narrator_web` triggers the contract version check. If importing the package also imported `fastapi`, `uvicorn`, and `python-multipart`, then merely importing the package would require the whole web stack. The web package is an independent install, so users who only want to check compatibility or the version should not need the web stack present.

**Decision Drivers**

- Importing the package should work without the web runtime installed.
- The heavy web dependencies should only be required when actually launching the server.
- The contract check must still run eagerly at import time.

**Considered Options**

- Importing `fastapi`/`uvicorn` at the top of the package (rejected: importing the package would require the whole web stack).
- Deferring everything to the CLI entry point (rejected: the package itself should still fail fast on an incompatible engine).

**Decision Outcome**

The package body imports only the contract check (`movie_narrator.contract`). `fastapi`, `uvicorn`, and the app factory are imported lazily inside `launch_web_api()`. As a result, `pip install movie-narrator-web` and `import movie_narrator_web` work without the web runtime, while the `mn-web` command pulls in the full stack only when it launches.

**Consequences**

- Positive: the package is importable and version-checkable without the web stack; the contract check still runs eagerly.
- Negative: the first `mn-web` launch pays the import cost lazily; errors in the web stack surface at launch rather than at import.

**References**

- `src/movie_narrator_web/__init__.py`
- `pyproject.toml`