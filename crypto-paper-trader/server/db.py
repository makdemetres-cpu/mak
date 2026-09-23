import json
import sqlite3
import threading
from pathlib import Path

MIGRATIONS = [
    """
    CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
    """,
]

DEFAULT_SETTINGS = {"currency": "USD"}


class Database:
    def __init__(self, path: Path | str):
        if str(path) != ":memory:":
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(path), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA foreign_keys = ON")
        self.lock = threading.Lock()
        self._migrate()

    def _migrate(self) -> None:
        with self.lock, self.conn:
            version = self.conn.execute("PRAGMA user_version").fetchone()[0]
            for index, sql in enumerate(MIGRATIONS[version:], start=version + 1):
                self.conn.executescript(sql)
                self.conn.execute(f"PRAGMA user_version = {index}")

    def get_settings(self) -> dict:
        with self.lock:
            rows = self.conn.execute("SELECT key, value FROM settings").fetchall()
        stored = {row["key"]: json.loads(row["value"]) for row in rows}
        return {**DEFAULT_SETTINGS, **stored}

    def update_settings(self, values: dict) -> dict:
        with self.lock, self.conn:
            for key, value in values.items():
                self.conn.execute(
                    "INSERT INTO settings (key, value) VALUES (?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (key, json.dumps(value)),
                )
        return self.get_settings()

    def close(self) -> None:
        self.conn.close()
