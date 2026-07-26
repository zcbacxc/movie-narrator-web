"""Web API — FastAPI + WebSocket backend for the React WebUI."""

from __future__ import annotations

# ── Contract version check ─────────────────────────────────
# Fail fast if the installed core engine doesn't meet the
# minimum contract version required by this web package.
from movie_narrator.contract import CONTRACT_VERSION

_MIN_CONTRACT = (0, 5, 0)
if CONTRACT_VERSION < _MIN_CONTRACT:
    raise ImportError(
        f"movie-narrator-web requires contract version >= {_MIN_CONTRACT}, "
        f"but the installed movie-narrator reports {CONTRACT_VERSION}. "
        f"Please upgrade: pip install -U movie-narrator"
    )

__all__ = ["launch_web_api"]


def launch_web_api(host: str = "127.0.0.1", port: int = 8760, reload: bool = False) -> None:
    """Start the FastAPI web API server.

    Imports are lazy so that ``mn web`` doesn't require fastapi/uvicorn
    unless the user actually launches the web UI.
    """
    import uvicorn

    from .server import create_app

    app = create_app()
    uvicorn.run(app, host=host, port=port, reload=reload)
