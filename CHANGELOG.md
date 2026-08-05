# Changelog

All notable changes to **movie-narrator-web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] — 2026-08-05

### Changed

- **Aligned to core engine v1.0**: `form_to_context_args` now passes
  `video_format=` to `build_context` instead of the legacy `format=` keyword.
  The web API keeps `format` as its own HTTP field name and maps it internally.
- **Minimum contract raised**: the web package now requires a 1.x core engine,
  matching the `video_format` signature and the stabilized i18n/preset/subtitle
  surface. The dependency floor is now `movie-narrator>=1.0.0` (was `>=0.5.0`).

## [1.0.4] — 2026-08-04

### Added

- **Web UI bilingual i18n (zh/en)**: a lightweight React-context i18n mechanism
  (typed message dictionaries, no extra dependencies) covering all components.
- **Language switcher** in the Header; the default follows the browser language
  and the choice is persisted in `localStorage`.
- **Backend `lang` parameter** (`zh` | `en`) validated and passed downstream to
  `build_context`, so the pipeline can produce narration in the selected
  language. The frontend sends `lang` with the task request.

## [1.0.3] — 2026-07-30

### Changed

- **Licensing standardization**: `pyproject.toml` now uses the PEP 639 string
  format (`license = "AGPL-3.0-or-later"`) with `setuptools>=77.0`, replacing
  the deprecated PEP 621 table format and `AGPL-3.0` identifier.
- **SPDX headers**: added standard SPDX headers to all 11 source files under
  `src/movie_narrator_web/`.

## [1.0.2] — 2026-07-28

### Fixed

- **Contract boundary violation in tests**: a test imported an internal core
  module; it now uses the public contract layer.

### Changed

- **Use contract `check_version()` helper**: replaced hand-written version
  comparison logic with the canonical helper from `movie_narrator.contract`.

## [1.0.1] — 2026-07-26

### Added

- Web UI (FastAPI + React SPA) for [movie-narrator](https://github.com/zcbacxc/movie-narrator), packaged as an independent PyPI package
- `mn-web` CLI entry point with `--host`, `--port`, `--reload` arguments
- WebSocket real-time progress streaming (`/ws/task/{task_id}`)
- REST API for task creation, monitoring, and control (`/api/tasks`)
- React frontend (Vite + TypeScript + shadcn/ui + Tailwind CSS)
- CI workflow: frontend build + Python test matrix (3.10–3.13)
- Publish workflow: PyPI trusted publishing with frontend build + wheel verification
- Contract version check at import time; depends on `movie-narrator` exclusively
  through the public contract layer, with an independent version line

[Unreleased]: https://github.com/zcbacxc/movie-narrator-web/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/zcbacxc/movie-narrator-web/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/zcbacxc/movie-narrator-web/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/zcbacxc/movie-narrator-web/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/zcbacxc/movie-narrator-web/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/zcbacxc/movie-narrator-web/releases/tag/v1.0.1