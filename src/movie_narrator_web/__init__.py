# SPDX-FileCopyrightText: 2026 zcbacxc
# SPDX-License-Identifier: AGPL-3.0-or-later

"""Web API — FastAPI + WebSocket backend for the React WebUI."""

from __future__ import annotations

__version__ = "1.1.0"

# ── Contract version check ─────────────────────────────────
# Fail fast if the installed core engine doesn't meet the
# minimum contract version required by this web package.
#
# NOTE: This checks the *contract* version (API compatibility),
# not the package version. movie-narrator-web uses an independent
# version line from the core engine — see README for details.
#
# Aligned to core engine v1.0: we rely on the ``build_context``
# ``video_format`` parameter (renamed from ``format`` in v1.0) and the
# i18n/preset/subtitle surface that stabilized in 1.x. Requiring
# contract >= 1.0.0 guarantees the web package runs against a 1.x engine.
from movie_narrator.contract import check_version

_MIN_CONTRACT = (1, 0, 0)
check_version(_MIN_CONTRACT)

__all__ = ["launch_web_api", "main"]


def launch_web_api(host: str = "127.0.0.1", port: int = 8760, reload: bool = False) -> None:
    """Start the FastAPI web API server.

    Imports are lazy so that ``mn-web`` doesn't require fastapi/uvicorn
    unless the user actually launches the web UI.
    """
    import uvicorn

    from .server import create_app

    app = create_app()
    uvicorn.run(app, host=host, port=port, reload=reload)


def main() -> None:
    """CLI entry point for ``mn-web`` command.

    Parses ``--host``, ``--port``, and ``--reload`` arguments,
    then delegates to :func:`launch_web_api`.
    """
    import argparse

    parser = argparse.ArgumentParser(
        prog="mn-web",
        description="Launch the Movie Narrator Web UI (FastAPI + React SPA).",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Bind address (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8760,
        help="Port to listen on (default: 8760)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload (development mode)",
    )
    args = parser.parse_args()
    launch_web_api(host=args.host, port=args.port, reload=args.reload)
