[![English](https://img.shields.io/badge/English-Stability-blue)](STABILITY.md)
[![简体中文](https://img.shields.io/badge/简体中文-稳定性承诺-green)](STABILITY.zh-CN.md)

# Stability Promise

This document defines stability guarantees for the `movie-narrator-web` package.

Unlike the core engine, `movie-narrator-web` does **not** maintain its own
public API surface or `CONTRACT_VERSION`. It is a thin consumer of
`movie_narrator.contract` and ships a FastAPI HTTP API plus a bundled React SPA.
The guarantees below therefore cover the **dependency contract** the package
requires from the core engine, and the **HTTP API + frontend** surface it
exposes to users.

## Core Dependency Contract

`movie-narrator-web` consumes the core engine exclusively through
`movie_narrator.contract` — no internal module imports. Compatibility is
enforced at import time by `check_version()`.

- **Minimum contract**: `_MIN_CONTRACT = (1, 0, 0)` in `__init__.py`.
- **Dependency floor**: `movie-narrator>=1.0.0` in `pyproject.toml`.
- **Check**: `from movie_narrator.contract import check_version; check_version((1, 0, 0))`

These two values must always stay in sync. If the package starts relying on a
newer contract feature, both the runtime check and the dependency floor are
raised together in the same release (see [ROADMAP.md](ROADMAP.md) and
[CHANGELOG.md](CHANGELOG.md)).

### What is Covered

- The `_MIN_CONTRACT` version requirement and its `check_version()` enforcement
- The `movie-narrator>=X.Y.Z` dependency floor in `pyproject.toml`
- The single import boundary: `movie_narrator_web` never imports core internals
- The `build_context` / `run_pipeline` call surface used by the task runner

### What is NOT Covered

- The core engine's own API surface — customers holding both packages should
  follow the core engine's [STABILITY.md](https://github.com/zcbacxc/movie-narrator/blob/main/docs/STABILITY.md)
- Internal modules of `movie_narrator_web` (form, tasks, ws, console) — these
  are implementation details and may change without notice
- Default parameter values and advanced form fields that are not documented as
  stable
- Output file formats produced by the core engine pipeline

## HTTP API Stability

The REST and WebSocket endpoints are the operational boundary for the Web UI.
Starting with **v1.1.0**, the following are treated as stable within the 1.x
series:

- `POST /api/tasks` — task creation (form fields, including `format`, `lang`,
  `narration_preset`)
- `GET /api/tasks/{id}` — task status
- `DELETE /api/tasks/{id}` — task cancellation
- `GET /api/artifacts/{id}` — artifact download
- `GET /api/video/{id}` — video streaming
- `GET /api/health` — health check
- `WS /ws/task/{id}` — progress stream

### Field Naming Note

The HTTP form field is **`format`** (e.g. `16:9` / `9:16`), matching the
frontend and the pre-v1.0 core naming. Internally the package maps it to the
core engine's `video_format` parameter. This HTTP field name is stable and will
not be renamed for frontend/API compatibility.

## Versioning Policy

`movie-narrator-web` follows [Semantic Versioning 2.0.0](https://semver.org/).
The version in `pyproject.toml` and `__version__` in `__init__.py` are always
bumped together in the same release.

| Component | Meaning |
|-----------|---------|
| **MAJOR** | Breaking changes to the HTTP API, frontend behavior, or the required core contract. Existing integrations may need updates. |
| **MINOR** | New features added in a backward-compatible manner. Existing usage continues to work unchanged. |
| **PATCH** | Bug fixes, security patches, and documentation updates. No API or behavior changes. |

### Alignment with Core Contract

Because the package is a consumer of the core contract, a change that raises
`_MIN_CONTRACT` or the dependency floor is at minimum a **MINOR** bump — it
changes the required core engine version. A change that would break existing
HTTP API consumers is a **MAJOR** bump.

## Python Version Support

`movie-narrator-web` supports the same Python versions as the core engine it
builds against:

| Python Version | Supported in 1.x | Notes |
|----------------|------------------|-------|
| 3.10           | Yes              | Minimum supported |
| 3.11           | Yes              | CI + publish target |
| 3.12           | Yes              | Tested in CI matrix |
| 3.13           | Yes              | Depends on core engine 3.13 support |

A minimum of **3** Python minor versions are supported at all times. New Python
versions are added in the next minor release after the core engine supports them.

## Deprecation Policy

When a stable HTTP field or endpoint must be removed or changed in a breaking
way, the package follows a deprecation-first policy:

1. **Deprecation announcement**: the feature is marked deprecated in a **minor**
   release. The frontend and documentation are updated to recommend the
   replacement.
2. **Deprecation window**: the deprecated feature remains available for at
   least **one full minor release cycle**.
3. **Removal**: the feature is removed in the next **major** version, or earlier
   in exceptional cases (security vulnerabilities, severe correctness bugs).

## Upgrade Guarantees

### Within the Same Major Version (1.x)

- **Zero breaking changes** to the HTTP API, frontend usage, or the required
  core contract floor.
- **New features are additive**: new form fields, endpoints, and views are
  added in minor releases without affecting existing usage.
- **Bug fixes are safe**: patch releases fix bugs without changing documented
  behavior. If a fix changes observable behavior, it is treated as a minor
  release with migration notes.

### Between Major Versions

- Breaking changes are allowed and expected.
- All breaking changes are documented in `CHANGELOG.md` under the appropriate
  category, with upgrade guidance.
- The previous major version receives security and critical bug fix support for
  at least **6 months** after the new major version is released.

---

*This stability policy is effective as of v1.1.0. For questions about API
stability or deprecation timelines, please open an issue on GitHub.*