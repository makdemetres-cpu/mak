"""SQLite (WAL) engine and session helpers."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import ROOT


def make_engine(database_path: str) -> Engine:
    if database_path == ":memory:":
        url = "sqlite://"
    else:
        path = Path(database_path)
        if not path.is_absolute():
            path = ROOT / path
        path.parent.mkdir(parents=True, exist_ok=True)
        url = f"sqlite:///{path}"
    # one shared connection for in-memory DBs (tests), so every thread sees the same data
    extra = {"poolclass": StaticPool} if database_path == ":memory:" else {}
    engine = create_engine(url, connect_args={"check_same_thread": False}, **extra)

    @event.listens_for(engine, "connect")
    def _pragmas(dbapi_conn, _record):  # noqa: ANN001
        cur = dbapi_conn.cursor()
        if database_path != ":memory:":
            cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA synchronous=NORMAL")
        cur.close()

    return engine


def upgrade_to_head(engine: Engine) -> None:
    """Apply Alembic migrations programmatically (used on every start)."""
    from alembic import command
    from alembic.config import Config as AlembicConfig

    cfg = AlembicConfig(str(ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    with engine.begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")


class Database:
    def __init__(self, database_path: str, migrate: bool = True):
        self.engine = make_engine(database_path)
        if migrate:
            upgrade_to_head(self.engine)
        else:  # tests: build straight from metadata
            from .models import Base
            Base.metadata.create_all(self.engine)
        self._sessions = sessionmaker(self.engine, expire_on_commit=False)

    @contextmanager
    def session(self) -> Iterator[Session]:
        s = self._sessions()
        try:
            yield s
            s.commit()
        except Exception:
            s.rollback()
            raise
        finally:
            s.close()
