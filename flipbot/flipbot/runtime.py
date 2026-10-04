"""Background jobs: heartbeat + downtime report, health checks, quiet-hour queue, backups."""

from __future__ import annotations

import logging
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .config import ROOT
from .service import FlipDesk

log = logging.getLogger("flipbot.runtime")
BACKUP_DIR = ROOT / "backups"
KEEP_BACKUPS = 14


def backup(desk: FlipDesk, target_dir: Path = BACKUP_DIR) -> Path | None:
    url = desk.db.engine.url
    if not url.database:
        return None
    target_dir.mkdir(parents=True, exist_ok=True)
    dest = target_dir / f"flipbot-{datetime.now():%Y%m%d-%H%M%S}.db"
    src = sqlite3.connect(url.database)
    with sqlite3.connect(dest) as out:
        src.backup(out)
    src.close()
    for old in sorted(target_dir.glob("flipbot-*.db"))[:-KEEP_BACKUPS]:
        old.unlink()
    return dest


class Runtime:
    def __init__(self, desk: FlipDesk):
        self.desk = desk
        self.scheduler = AsyncIOScheduler()
        self.telegram = None
        self.connector_states: dict[str, str] = {}

    async def start(self) -> None:
        from .telegram_bot import TelegramBot
        self.pending: list[str] = []  # messages waiting for Telegram to come up
        self.bot = TelegramBot(self.desk)
        if self.bot.enabled():
            await self._connect_telegram()
            if not self.telegram:  # e.g. no internet yet right after boot — keep trying
                self.scheduler.add_job(self._connect_telegram, "interval", minutes=2, id="telegram_retry")
        else:
            log.info("Telegram disabled: set TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWED_USER_IDS in .env")

        downtime = self.desk.beat()
        if downtime:
            await self._say(f"⚠️ FlipDesk was down for ~{_human(downtime)} (power cut or restart). Back online.")
        hh, mm = map(int, self.desk.cfg.notifications.heartbeat_time.split(":"))
        self.scheduler.add_job(self.desk.beat, "interval", minutes=1, id="heartbeat")
        self.scheduler.add_job(self._morning, "cron", hour=hh, minute=mm, id="morning")
        self.scheduler.add_job(self._health, "interval", minutes=5, id="health", jitter=30)
        self.scheduler.add_job(self._flush, "interval", minutes=5, id="quiet_flush")
        self.scheduler.add_job(backup, "cron", hour=3, minute=17, args=[self.desk], id="backup")
        self.scheduler.start()

    async def _connect_telegram(self) -> None:
        if self.telegram:
            return
        try:
            await self.bot.start()
        except Exception as exc:  # noqa: BLE001 - Telegram down must not stop the desk
            self.desk.telegram_state = f"error, retrying every 2 min ({type(exc).__name__})"
            log.warning("Telegram failed to start (%s); dashboard keeps running", type(exc).__name__)
            return
        self.telegram = self.bot
        self.desk.telegram_state = "connected"
        if self.scheduler.get_job("telegram_retry"):
            self.scheduler.remove_job("telegram_retry")
        queued, self.pending = self.pending, []
        for text in queued:
            await self._say(text)

    async def stop(self) -> None:
        self.scheduler.shutdown(wait=False)
        if self.telegram:
            await self.telegram.stop()

    async def _say(self, text: str) -> None:
        if not self.telegram:
            if self.bot.enabled():
                self.pending.append(text)
            return
        try:
            await self.telegram.send(text, urgent=True)
        except Exception:  # noqa: BLE001
            log.exception("Telegram send failed")

    async def _morning(self) -> None:
        o = self.desk.overview()
        await self._say(f"☀️ FlipDesk heartbeat · {o['mode']} · up {_human(timedelta(seconds=o['uptime_seconds']))}\n"
                        f"Candidates today {o['candidates_today']} · HOT {o['hot_deals']} · "
                        f"Month profit €{o['realized_profit_month']:.0f}")

    async def _health(self) -> None:
        for row in self.desk.connector_rows():
            before = self.connector_states.get(row["name"])
            self.connector_states[row["name"]] = row["state"]
            if before and before == "ONLINE" and row["state"] != "ONLINE":
                await self._say(f"🔌 {row['display_name']} is {row['state']}: {row['detail']}")

    async def _flush(self) -> None:
        if self.telegram:
            await self.telegram.flush_quiet_queue()


def _human(delta: timedelta) -> str:
    minutes = int(delta.total_seconds() // 60)
    if minutes < 60:
        return f"{minutes} min"
    hours, minutes = divmod(minutes, 60)
    return f"{hours} h {minutes} min" if hours < 48 else f"{hours // 24} days"
