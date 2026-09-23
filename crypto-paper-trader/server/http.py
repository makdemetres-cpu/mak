import asyncio
import time

import httpx

from .safety import LIVE_TRADING_HOSTS

ALLOWED_HOSTS = {
    "api.exchange.coinbase.com",
    "status.coinbase.com",
    "api.kraken.com",
    "data.alpaca.markets",
    "api.coingecko.com",
    "data-api.ecb.europa.eu",
    "www.sec.gov",
    "data.sec.gov",
    "efts.sec.gov",
    "disclosures-clerk.house.gov",
    "efdsearch.senate.gov",
    "api.anthropic.com",
    "127.0.0.1",
    "localhost",
}

MIN_INTERVAL_SECONDS = {
    "api.exchange.coinbase.com": 0.34,
    "api.kraken.com": 1.0,
    "data.alpaca.markets": 0.3,
    "api.coingecko.com": 2.0,
    "www.sec.gov": 0.12,
    "data.sec.gov": 0.12,
    "efts.sec.gov": 0.12,
}


class BlockedHostError(RuntimeError):
    pass


class HostThrottle:
    def __init__(self) -> None:
        self._locks: dict[str, asyncio.Lock] = {}
        self._last: dict[str, float] = {}

    async def wait(self, host: str) -> None:
        interval = MIN_INTERVAL_SECONDS.get(host)
        if not interval:
            return
        lock = self._locks.setdefault(host, asyncio.Lock())
        async with lock:
            gap = time.monotonic() - self._last.get(host, 0.0)
            if gap < interval:
                await asyncio.sleep(interval - gap)
            self._last[host] = time.monotonic()


def check_host(url: httpx.URL) -> None:
    host = (url.host or "").lower()
    path = url.path or ""
    if host in LIVE_TRADING_HOSTS or (host == "api.kraken.com" and path.startswith("/0/private")):
        raise BlockedHostError(f"Refused request to trading host {host}. This app only paper trades.")
    if host not in ALLOWED_HOSTS:
        raise BlockedHostError(f"Refused request to {host}: not on the list of trusted data sources.")


def make_client(transport: httpx.AsyncBaseTransport | None = None, throttle: bool = True) -> httpx.AsyncClient:
    throttler = HostThrottle() if throttle else None

    async def on_request(request: httpx.Request) -> None:
        check_host(request.url)
        if throttler:
            await throttler.wait((request.url.host or "").lower())

    return httpx.AsyncClient(
        transport=transport,
        timeout=httpx.Timeout(10.0, connect=5.0),
        event_hooks={"request": [on_request]},
        headers={"Accept": "application/json"},
        follow_redirects=False,
    )
