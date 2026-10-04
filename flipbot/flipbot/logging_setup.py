"""Structured, rotating logs: system, error, audit, ai_usage."""

from __future__ import annotations

import json
import logging
from logging.handlers import RotatingFileHandler

from .config import ROOT

LOG_DIR = ROOT / "logs"


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {"at": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"), "level": record.levelname,
                "logger": record.name, "msg": record.getMessage()}
        if record.exc_info:
            data["exc"] = self.formatException(record.exc_info)
        return json.dumps(data, ensure_ascii=False)


def _file(name: str, level: int = logging.INFO) -> RotatingFileHandler:
    h = RotatingFileHandler(LOG_DIR / name, maxBytes=5_000_000, backupCount=5, encoding="utf-8")
    h.setLevel(level)
    h.setFormatter(JsonFormatter())
    return h


def setup() -> None:
    LOG_DIR.mkdir(exist_ok=True)
    root = logging.getLogger("flipbot")
    if root.handlers:
        return
    root.setLevel(logging.INFO)
    root.addHandler(_file("system.log"))
    root.addHandler(_file("error.log", logging.ERROR))
    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
    root.addHandler(console)
    logging.getLogger("flipbot.audit").addHandler(_file("audit.log"))
    logging.getLogger("flipbot.ai").addHandler(_file("ai_usage.log"))
    # never let a library echo a URL containing the bot token
    logging.getLogger("httpx").setLevel(logging.WARNING)
