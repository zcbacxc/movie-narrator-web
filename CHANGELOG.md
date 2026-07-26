# Changelog

All notable changes to **movie-narrator-web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] — 2026-07-26

### Changed
- **Independent versioning** — movie-narrator-web now uses its own version line, separate from the core engine (`movie-narrator`). The package version no longer mirrors the core's version number.
- Compatibility with the core engine is determined solely by `CONTRACT_VERSION` (checked at import time in `__init__.py`), not by comparing package version numbers.
- Bumped from 0.5.0 → 1.0.0 to signal the start of the independent version line. No functional changes.

### Why independent versioning?
Previously, both packages shared the `0.5.x` version range, which created confusion — users might assume the web package was "behind" the core engine when version numbers differed. With independent versioning:
- `movie-narrator-web` bumps on its own changes (UI, API routes, etc.)
- `movie-narrator` (core) bumps on its own changes (pipeline, providers, etc.)
- Compatibility is guaranteed by the `CONTRACT_VERSION` check, not version number matching

## [0.5.0] — 2026-07-26

### Added
- Extracted WebUI (FastAPI + React) into a standalone package
- `mn-web` entry point for standalone web UI launch
- CI workflow: frontend build + Python test matrix (3.10–3.13)
- Publish workflow: PyPI publish with frontend build + wheel verification
- Depends on `movie-narrator>=0.5.0` through public contract layer

### Fixed
- `mn-web` CLI entry point now properly parses `--host`, `--port`, and `--reload` arguments via argparse (previously called `launch_web_api` directly, which ignored all CLI flags)

### Architecture
- All imports use `movie_narrator_web` (not `movie_narrator.web_api`)
- Depends on core engine exclusively through `movie_narrator.contract`
- No internal module imports — clean API boundary
