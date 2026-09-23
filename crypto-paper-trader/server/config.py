import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
ENV_FILE = ROOT / ".env"
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    sec_contact_email: str
    alpaca_key_id: str
    alpaca_secret: str
    coingecko_key: str
    anthropic_key: str
    ollama_url: str
    db_path: Path
    raw_env: dict[str, str]


def load_settings(env_file: Path = ENV_FILE, overrides: dict[str, str] | None = None) -> Settings:
    env: dict[str, str] = {}
    if env_file.exists():
        env.update({k: v or "" for k, v in dotenv_values(env_file).items()})
    for key, value in os.environ.items():
        if key in env or key.startswith(("ALPACA", "APCA", "COINBASE", "KRAKEN", "ANTHROPIC", "COINGECKO", "SEC_", "OLLAMA", "BINANCE")):
            env.setdefault(key, value)
    if overrides:
        env.update(overrides)

    return Settings(
        host=env.get("HOST", "127.0.0.1").strip() or "127.0.0.1",
        port=int(env.get("PORT", "8765") or 8765),
        sec_contact_email=env.get("SEC_CONTACT_EMAIL", "").strip(),
        alpaca_key_id=env.get("ALPACA_API_KEY_ID", "").strip(),
        alpaca_secret=env.get("ALPACA_API_SECRET_KEY", "").strip(),
        coingecko_key=env.get("COINGECKO_DEMO_API_KEY", "").strip(),
        anthropic_key=env.get("ANTHROPIC_API_KEY", "").strip(),
        ollama_url=(env.get("OLLAMA_URL", "") or "http://127.0.0.1:11434").strip(),
        db_path=Path(env.get("DB_PATH", "") or DATA_DIR / "app.db"),
        raw_env=env,
    )
