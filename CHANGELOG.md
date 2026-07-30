# Changelog

All notable changes to **movie-narrator-web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] — 2026-07-30

### Changed

- **Licensing standardization**: updated `pyproject.toml` to PEP 639 string format (`license = "AGPL-3.0-or-later"`) with `setuptools>=77.0` build requirement, replacing the deprecated PEP 621 table format and `AGPL-3.0` identifier.
- **SPDX headers**: added `SPDX-FileCopyrightText` and `SPDX-License-Identifier: AGPL-3.0-or-later` headers to all 11 source files under `src/movie_narrator_web/`.
- **README**: updated license reference from `AGPL-3.0` to `AGPL-3.0-or-later`.

### Notes

- Aligns with core engine (`movie-narrator` v0.6.1) licensing conventions.
- `CONTRACT_VERSION` requirement unchanged — still `(0, 5, 0)`.

## [1.0.2] — 2026-07-28

### Fixed

- **Contract boundary violation in tests** (`tests/test_controller.py`): changed `from movie_narrator.pipeline.errors import PipelineCancelled, check_cancelled` to `from movie_narrator.contract import PipelineCancelled, check_cancelled`. The test was the only file in the web package that bypassed the contract layer and imported from an internal core module, violating the "no internal module imports" rule declared in README and CHANGELOG.

### Changed

- **Use contract `check_version()` helper** (`__init__.py`): replaced hand-written version comparison logic with the `check_version()` helper function exported from `movie_narrator.contract`. This eliminates duplicate implementation and uses the canonical version-check utility provided by the core engine.

### Notes

- `CONTRACT_VERSION` requirement unchanged — still `(0, 5, 0)`.
- All 64 web tests pass (0 failures).

## [1.0.1] — 2026-07-26

### Initial release

- Web UI (FastAPI + React SPA) for [movie-narrator](https://github.com/zcbacxc/movie-narrator), packaged as an independent PyPI package
- `mn-web` CLI entry point with `--host`, `--port`, `--reload` arguments
- WebSocket real-time progress streaming (`/ws/task/{task_id}`)
- REST API for task creation, monitoring, and control (`/api/tasks`)
- React frontend (Vite + TypeScript + shadcn/ui + Tailwind CSS)
- CI workflow: frontend build + Python test matrix (3.10–3.13)
- Publish workflow: PyPI trusted publishing with frontend build + wheel verification
- Contract version check at import time (`CONTRACT_VERSION >= (0, 5, 0)`)

### Architecture

- Depends on `movie-narrator>=0.5.0` exclusively through the public contract layer (`movie_narrator.contract`)
- No internal module imports — clean API boundary
- Uses an **independent version line** separate from the core engine; compatibility is determined by `CONTRACT_VERSION`, not by matching package version numbers
