import re
from urllib.parse import urlparse

from .config import LOCAL_HOSTS, Settings

# Hosts that can place real-money orders. The app never needs any of them.
LIVE_TRADING_HOSTS = {
    "api.alpaca.markets",
    "broker-api.alpaca.markets",
    "api.coinbase.com",
    "api.prime.coinbase.com",
    "api.international.coinbase.com",
    "futures.kraken.com",
    "api.binance.com",
    "api.binance.us",
}

EXCHANGE_ACCOUNT_KEY_PREFIXES = ("COINBASE_", "KRAKEN_", "BINANCE_")
URL_RE = re.compile(r"https?://[^\s'\"]+|wss?://[^\s'\"]+", re.IGNORECASE)


class SafetyError(RuntimeError):
    def __init__(self, problems: list[str]):
        self.problems = problems
        super().__init__("\n".join(problems))


def find_problems(settings: Settings) -> list[str]:
    problems: list[str] = []

    if settings.host not in LOCAL_HOSTS:
        problems.append(
            f"HOST is set to {settings.host!r}. This app only runs on your own computer, "
            "so it must listen on 127.0.0.1. Remove HOST from .env."
        )

    if settings.alpaca_key_id.upper().startswith("AK"):
        problems.append(
            "ALPACA_API_KEY_ID looks like a LIVE-account key (it starts with AK). "
            "Use a key from an Alpaca paper account instead (it starts with PK)."
        )

    for name, value in settings.raw_env.items():
        if not value:
            continue
        if name.upper().startswith(EXCHANGE_ACCOUNT_KEY_PREFIXES):
            problems.append(
                f"{name} is set. This app never logs in to an exchange account, "
                "so exchange keys are not allowed. Remove it from .env."
            )
        for url in URL_RE.findall(value):
            host = (urlparse(url).hostname or "").lower()
            if host in LIVE_TRADING_HOSTS or (host == "api.kraken.com" and "/private" in url):
                problems.append(
                    f"{name} points to {host}, which can place real-money trades. "
                    "This app only paper trades. Remove it from .env."
                )
    return problems


def enforce(settings: Settings) -> None:
    problems = find_problems(settings)
    if problems:
        raise SafetyError(problems)
