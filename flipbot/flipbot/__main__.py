"""Command line — `python -m flipbot <command>`. The .bat files call these.

  start   launcher + watchdog: runs the server, restarts it if it crashes (start.bat, auto-start)
  serve   the server itself (started by `start`; run it directly only for debugging)
  stop    graceful stop, force-stop as a last resort (stop.bat)
  status  is it running? (status.bat)
  open    wait until the dashboard answers, then open it in the browser
  backup  one-off database backup
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta
from logging.handlers import RotatingFileHandler

from .config import ROOT

DATA = ROOT / "data"
LOGS = ROOT / "logs"
RUNTIME = DATA / "runtime.json"      # written by the server: pid, port, stop token
STOP_FLAG = DATA / "stop.flag"       # tells the launcher not to restart the server
LAUNCHER_LOCK = DATA / "launcher.lock"
LAUNCHER_PID = DATA / "launcher.pid"
DEFAULT_PORT = 8765
WINDOWS = os.name == "nt"


# --------------------------------------------------------------------------- helpers
def _url(args, path: str = "") -> str:
    return f"http://{args.host}:{args.port}{path}"


def _overview(args, timeout: float = 3) -> dict | None:
    try:
        with urllib.request.urlopen(_url(args, "/api/overview"), timeout=timeout) as r:
            return json.load(r)
    except (OSError, ValueError):
        return None


def _pid_alive(pid: int | None) -> bool:
    if not pid:
        return False
    if WINDOWS:  # os.kill(pid, 0) would TERMINATE the process on Windows
        import ctypes
        handle = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid)  # QUERY_LIMITED_INFORMATION
        if not handle:
            return False
        code = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(code))
        ctypes.windll.kernel32.CloseHandle(handle)
        return code.value == 259  # STILL_ACTIVE
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _force_kill(pid: int) -> None:
    if WINDOWS:
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
    else:
        import signal
        try:
            os.kill(pid, signal.SIGTERM)
        except ProcessLookupError:
            pass


def _try_lock(path):
    """Exclusive, non-blocking OS file lock held for the launcher's lifetime (no stale PID problem)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = open(path, "a+")
    try:
        if WINDOWS:
            import msvcrt
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        return None
    return handle


def _release_lock(handle) -> None:
    try:
        if WINDOWS:
            import msvcrt
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        handle.close()
    except OSError:
        pass


def _human(seconds: float) -> str:
    return str(timedelta(seconds=int(seconds)))


# -------------------------------------------------------------------------- commands
def cmd_start(args) -> int:
    if _overview(args):
        print(f"FlipDesk is already running at {_url(args)}")
        return 0
    lock = _try_lock(LAUNCHER_LOCK)
    if lock is None:
        print("FlipDesk is already starting up.")
        return 0
    STOP_FLAG.unlink(missing_ok=True)
    LAUNCHER_PID.write_text(str(os.getpid()))
    LOGS.mkdir(exist_ok=True)
    log = logging.getLogger("flipbot.launcher")
    log.setLevel(logging.INFO)
    handler = RotatingFileHandler(LOGS / "launcher.log", maxBytes=1_000_000, backupCount=3, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    log.addHandler(handler)

    cmd = [sys.executable, "-m", "flipbot", "serve", "--host", args.host, "--port", str(args.port)]
    flags = subprocess.CREATE_NO_WINDOW if WINDOWS else 0
    backoff = 5
    log.info("launcher started (pid %s)", os.getpid())
    try:
        while True:
            started = time.monotonic()
            proc = subprocess.Popen(cmd, cwd=ROOT, creationflags=flags)
            code = proc.wait()
            if STOP_FLAG.exists():
                log.info("server stopped on request")
                break
            if code == 2:
                log.error("server refused to start (LIVE mode blockers) — not restarting")
                break
            if _overview(args):
                log.info("another FlipDesk is serving on port %s — launcher exiting", args.port)
                break
            if time.monotonic() - started > 600:
                backoff = 5  # it ran fine for a while; restart quickly
            log.warning("server exited with code %s — restarting in %s s", code, backoff)
            time.sleep(backoff)
            backoff = min(backoff * 2, 300)
    except KeyboardInterrupt:
        pass
    finally:
        STOP_FLAG.unlink(missing_ok=True)
        LAUNCHER_PID.unlink(missing_ok=True)
        _release_lock(lock)
        log.info("launcher stopped")
    return 0


def cmd_serve(args) -> int:
    from . import logging_setup
    from .config import live_blockers, load_config
    logging_setup.setup()
    cfg = load_config()

    if cfg.mode == "LIVE":
        from .db import Database
        from .engine import pricerules
        with Database(cfg.database_path).session() as s:
            version = pricerules.active_version(s)
            blockers = live_blockers(cfg, bool(version and not version.is_sample))
        if blockers:
            logging.getLogger("flipbot").error("LIVE mode is blocked until these are set: %s", blockers)
            print("LIVE mode is blocked until these are set:\n  - " + "\n  - ".join(blockers))
            return 2

    import uvicorn
    from .web.app import create_app
    app = create_app(cfg)
    token = secrets.token_urlsafe(32)
    server = uvicorn.Server(uvicorn.Config(app, host=args.host, port=args.port, log_level="warning"))
    app.state.control_token, app.state.server = token, server
    DATA.mkdir(exist_ok=True)
    RUNTIME.write_text(json.dumps({"pid": os.getpid(), "host": args.host, "port": args.port,
                                   "token": token, "started_at": datetime.now().isoformat()}))
    try:
        server.run()
    finally:
        RUNTIME.unlink(missing_ok=True)
    return 0 if server.started else 3


def cmd_stop(args) -> int:
    DATA.mkdir(exist_ok=True)
    STOP_FLAG.touch()  # the launcher must not restart the server
    live = _overview(args)
    try:
        runtime = json.loads(RUNTIME.read_text())
    except (OSError, ValueError):
        runtime = {}
    if live and runtime.get("token"):
        req = urllib.request.Request(_url(args, "/api/admin/shutdown"), method="POST",
                                     headers={"X-FlipDesk-Token": runtime["token"]})
        try:
            urllib.request.urlopen(req, timeout=5).close()
        except (OSError, urllib.error.HTTPError):
            pass
        for _ in range(40):
            if not _overview(args, timeout=1):
                break
            time.sleep(0.5)
    still = _overview(args, timeout=2)
    if still and still.get("pid"):  # only kill the PID the live server itself reports
        _force_kill(int(still["pid"]))
        time.sleep(1)

    # give the launcher a moment to notice the stop flag, then force it only if it's really there
    for _ in range(20):
        lock = _try_lock(LAUNCHER_LOCK)
        if lock is not None:
            _release_lock(lock)
            break
        time.sleep(0.5)
    else:
        try:
            pid = int(LAUNCHER_PID.read_text())
        except (OSError, ValueError):
            pid = None
        if pid and _pid_alive(pid):
            _force_kill(pid)
    STOP_FLAG.unlink(missing_ok=True)
    print("FlipDesk stopped." if live else "FlipDesk was not running.")
    return 0


def cmd_status(args) -> int:
    o = _overview(args)
    if not o:
        print("FlipDesk is NOT running.\nDouble-click start.bat to start it.")
        return 1
    lines = [
        "FlipDesk is RUNNING",
        f"  Dashboard : {_url(args)}",
        f"  Mode      : {o['mode']}" + ("  (scanning paused)" if o.get("paused") else ""),
        f"  Up for    : {_human(o['uptime_seconds'])}",
        f"  Telegram  : {o.get('telegram', 'unknown')}",
        f"  Today     : {o['candidates_today']} candidates, {o['hot_deals']} HOT",
        f"  Profit    : EUR {o['realized_profit_month']:.0f} this month",
    ]
    if o["mode"] == "PAPER":
        lines.append(f"  LIVE mode : blocked until {len(o['live_blockers'])} settings are filled in")
    print("\n".join(lines))
    return 0


def cmd_open(args) -> int:
    import webbrowser
    for _ in range(180):
        if _overview(args, timeout=1):
            webbrowser.open(_url(args))
            print(f"Dashboard opened: {_url(args)}")
            return 0
        time.sleep(0.5)
    print(f"FlipDesk did not answer within 90 seconds. Look at {LOGS / 'error.log'} "
          f"and {LOGS / 'launcher.log'}.")
    return 1


def cmd_backup(args) -> int:
    from .config import load_config
    from .db import Database
    from .runtime import backup
    from .service import FlipDesk
    cfg = load_config()
    print(backup(FlipDesk(cfg, Database(cfg.database_path))))
    return 0


def main() -> int:
    # pythonw.exe (no console window) has no stdout/stderr — send them to a log file
    if sys.stdout is None or sys.stderr is None:
        LOGS.mkdir(exist_ok=True)
        stream = open(LOGS / "console.log", "a", encoding="utf-8", buffering=1)
        sys.stdout = sys.stdout or stream
        sys.stderr = sys.stderr or stream

    parser = argparse.ArgumentParser(prog="flipbot")
    parser.add_argument("command", nargs="?", default="start",
                        choices=["start", "serve", "stop", "status", "open", "backup"])
    parser.add_argument("--host", default="127.0.0.1", help="keep 127.0.0.1 unless using Tailscale")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    return {"start": cmd_start, "serve": cmd_serve, "stop": cmd_stop, "status": cmd_status,
            "open": cmd_open, "backup": cmd_backup}[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
