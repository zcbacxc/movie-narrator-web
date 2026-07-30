# movie-narrator-web

![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![License](https://img.shields.io/github/license/zcbacxc/movie-narrator-web)
![CI](https://github.com/zcbacxc/movie-narrator-web/actions/workflows/ci.yml/badge.svg)
![PyPI](https://img.shields.io/pypi/v/movie-narrator-web)
![Downloads](https://img.shields.io/pypi/dm/movie-narrator-web)

Web UI (FastAPI + React) for [movie-narrator](https://github.com/zcbacxc/movie-narrator).

> **Versioning**: This package uses an **independent version line**,
> separate from the core engine (`movie-narrator`). Compatibility is guaranteed by the
> `CONTRACT_VERSION` check at import time — you do not need to match version numbers
> between the two packages.

This is a separate package from the core engine. Install it only if you need
the web interface:

```bash
pip install movie-narrator-web
```

This automatically pulls in `movie-narrator` (core engine) and all web
dependencies (FastAPI, uvicorn).

## Prerequisites

- Python >= 3.10
- ffmpeg (required by the core engine for audio/video processing)

## Usage

```bash
mn-web --host 127.0.0.1 --port 8760
```

For development with auto-reload:

```bash
mn-web --reload
```

### CLI Options

| Option | Default | Description |
|--------|---------|-------------|
| `--host` | `127.0.0.1` | Bind address |
| `--port` | `8760` | Port to listen on |
| `--reload` | off | Enable auto-reload (development mode) |

Or programmatically:

```python
from movie_narrator_web import launch_web_api

launch_web_api(host="127.0.0.1", port=8760)
```

## Development

The frontend source is in `webui/` (React + Vite + TypeScript + shadcn/ui).
Build the SPA before packaging:

```bash
cd webui
npm ci
npm run build
```

The build output lands in `src/movie_narrator_web/static/` and is served
by FastAPI in production mode.

## Architecture

This package depends on `movie-narrator` exclusively through the public
contract layer (`movie_narrator.contract`). No internal module imports.

## Documentation

- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

## License

Licensed under the [AGPL-3.0-or-later](LICENSE) License.
