# Contributing to movie-narrator-web

Thanks for your interest in contributing! This guide covers the development workflow.

## Development Setup

### Backend (Python)

```bash
git clone https://github.com/zcbacxc/movie-narrator-web.git
cd movie-narrator-web
pip install -e ".[dev]"
```

The core engine is installed automatically as a dependency. For development against the latest core:

```bash
pip install git+https://github.com/zcbacxc/movie-narrator.git
pip install --no-deps -e .
```

### Frontend (React + Vite)

```bash
cd webui
npm ci
npm run dev    # Vite dev server on :5173
```

Build the SPA for packaging:

```bash
npm run build  # outputs to src/movie_narrator_web/static/
```

Type-check the frontend (no emit):

```bash
npx tsc --noEmit
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test modules
pytest tests/test_web_form.py -v
pytest tests/test_controller.py -v
```

## Branch Strategy

- `main` — stable, always deployable
- `feature/*` — new features
- `hotfix/*` — urgent fixes

All changes go through pull requests. CI must pass before merge.

## Commit Conventions

Use conventional commit messages:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `refactor:` code restructuring
- `chore:` maintenance tasks

## Frontend Development

The frontend is a React SPA (Vite + TypeScript + shadcn/ui + Tailwind CSS).

- Source: `webui/src/`
- API client: `webui/src/lib/api.ts`
- Main app: `webui/src/App.tsx`
- Build config: `webui/vite.config.ts`

The Vite dev server proxies API requests to the FastAPI backend. During development, run the backend on :8760 and the frontend on :5173.
