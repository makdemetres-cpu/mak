"""`python -m flipbot [start|status|backup]` — one command starts everything."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request


def main() -> int:
    parser = argparse.ArgumentParser(prog="flipbot")
    parser.add_argument("command", nargs="?", default="start", choices=["start", "status", "backup"])
    parser.add_argument("--host", default="127.0.0.1", help="keep 127.0.0.1 unless using Tailscale")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    if args.command == "status":
        try:
            with urllib.request.urlopen(f"http://{args.host}:{args.port}/api/overview", timeout=3) as r:
                print(json.dumps(json.load(r), indent=2, ensure_ascii=False))
            return 0
        except OSError:
            print("FlipDesk is not running")
            return 1

    from . import logging_setup
    from .config import live_blockers, load_config
    logging_setup.setup()
    cfg = load_config()

    if args.command == "backup":
        from .db import Database
        from .runtime import backup
        from .service import FlipDesk
        print(backup(FlipDesk(cfg, Database(cfg.database_path))))
        return 0

    if cfg.mode == "LIVE":
        from .db import Database
        from .engine import pricerules
        db = Database(cfg.database_path)
        with db.session() as s:
            version = pricerules.active_version(s)
            blockers = live_blockers(cfg, bool(version and not version.is_sample))
        if blockers:
            print("LIVE mode is blocked until these are set:\n  - " + "\n  - ".join(blockers))
            return 2

    import uvicorn
    from .web.app import create_app
    uvicorn.run(create_app(cfg), host=args.host, port=args.port, log_level="warning")
    return 0


if __name__ == "__main__":
    sys.exit(main())
