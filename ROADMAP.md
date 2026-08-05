[![English](https://img.shields.io/badge/English-Roadmap-blue)](ROADMAP.md)
[![简体中文](https://img.shields.io/badge/简体中文-路线图-green)](ROADMAP.zh-CN.md)

# Roadmap

> Per-version details in [CHANGELOG.md](CHANGELOG.md). This package uses an
> **independent version line** from the core engine (`movie-narrator`); the
> two are decoupled and compatibility is governed by `CONTRACT_VERSION`.

## Completed

| Version | Key Themes |
|---------|-------------|
| v1.0.1 | Initial release / FastAPI + React SPA / WebSocket progress / REST task API / PyPI package / contract check at import |
| v1.0.2 | Contract boundary hygiene / `check_version()` helper / test contract-compliance fix |
| v1.0.3 | Licensing standardization / PEP 639 / SPDX headers / AGPL-3.0-or-later |
| v1.0.4 | Bilingual i18n (zh/en) / language switcher / backend `lang` passthrough |
| v1.1.0 | **Align to core engine v1.0** / `video_format` mapping / minimum contract `(1, 0, 0)` / dependency floor `>=1.0.0` |

Minimum contract required by the current version: `(1, 0, 0)`.

---

## Current & Planned

> **Planning principle**: Ship incremental, low-risk releases that stay aligned
> with the core engine's contract surface. The Web UI is a thin consumer of
> `movie_narrator.contract`; its roadmap tracks frontend UX and operator
> ergonomics rather than engine features.

### v1.2.0 — Web UI Polish (planning)

> **Goal**: Better operator experience and self-service insight without
> changing the API contract.

- [ ] Rich task detail view — per-step timing, artifact preview cards
- [ ] Settings / environment view in the UI (read-only mirror of engine config)
- [ ] Persistent task history across restarts (basic JSONL store)
- [ ] Keyboard shortcuts for the create panel
- [ ] Frontend accessibility pass (ARIA, focus management)

---

### v1.3.0 — Deployment & Operations (planning)

> **Goal**: Make the Web UI production-ready for single-tenant service use.

- [ ] Configurable bind host / port via env vars with `MN_WEB_` prefix
- [ ] Optional static token auth for the API
- [ ] Request logging + basic request metrics endpoint
- [ ] Docker image for the Web UI alongside the core engine
- [ ] Health check parity with the core engine's `/api/health`

---

### Post-v1.3 — Demand-Driven

Items below are not committed; they will be prioritized based on community
feedback:

- Multi-user / workspaces — auth, per-user task isolation (only if SaaS demand materializes)
- Task queue dashboard — in-browser queue visualization and reordering
- Plugin management UI — enable/disable installed core plugins from the browser
- Mobile layout optimization — touch-first results and monitoring views