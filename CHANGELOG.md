# Changelog

All notable changes to **movie-narrator-web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `mn-web` CLI entry point now properly parses `--host`, `--port`, and `--reload` arguments via argparse (previously called `launch_web_api` directly, which ignored all CLI flags)

## [0.5.0] — 2026-07-26

### Added
- Extracted WebUI (FastAPI + React) into a standalone package
- `mn-web` entry point for standalone web UI launch
- CI workflow: frontend build + Python test matrix (3.10–3.13)
- Publish workflow: PyPI publish with frontend build + wheel verification
- Depends on `movie-narrator>=0.5.0` through public contract layer

### Architecture
- All imports use `movie_narrator_web` (not `movie_narrator.web_api`)
- Depends on core engine exclusively through `movie_narrator.contract`
- No internal module imports — clean API boundary
