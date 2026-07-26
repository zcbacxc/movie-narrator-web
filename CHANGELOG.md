# Changelog

All notable changes to **movie-narrator-web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
