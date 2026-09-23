import asyncio
from datetime import datetime, timedelta, timezone

import httpx

from ..models import Candle, CandleSeries, Quote
from .base import ProviderError, get_json, parse_iso, to_float

BASE_URL = "https://api.exchange.coinbase.com"
STATUS_URL = "https://status.coinbase.com/api/v2/status.json"
SOURCE = "coinbase"
MAX_CANDLES_PER_REQUEST = 300
GRANULARITIES = {60, 300, 900, 3600, 21600, 86400}


class CoinbaseProvider:
    source = SOURCE

    def __init__(self, client: httpx.AsyncClient, clock=lambda: datetime.now(timezone.utc)):
        self.client = client
        self.clock = clock

    async def products(self) -> list[dict]:
        data = await get_json(self.client, SOURCE, f"{BASE_URL}/products")
        if not isinstance(data, list):
            raise ProviderError(SOURCE, "bad_data", "Coinbase sent an unexpected list of markets.")
        return data

    async def currencies(self) -> dict[str, str]:
        data = await get_json(self.client, SOURCE, f"{BASE_URL}/currencies")
        if not isinstance(data, list):
            raise ProviderError(SOURCE, "bad_data", "Coinbase sent an unexpected list of coins.")
        return {str(c["id"]).upper(): str(c.get("name") or c["id"]) for c in data if isinstance(c, dict) and c.get("id")}

    async def quote(self, base: str, currency: str, pair: str) -> Quote:
        ticker, stats = await asyncio.gather(
            get_json(self.client, SOURCE, f"{BASE_URL}/products/{pair}/ticker"),
            get_json(self.client, SOURCE, f"{BASE_URL}/products/{pair}/stats"),
        )
        if not isinstance(ticker, dict) or not isinstance(stats, dict):
            raise ProviderError(SOURCE, "bad_data", "Coinbase sent a price we couldn't read.")
        return Quote(
            base=base,
            currency=currency,
            price=to_float(ticker.get("price")),
            source=SOURCE,
            fetched_at=self.clock(),
            observed_at=parse_iso(ticker.get("time")),
            pair=pair,
            bid=to_float(ticker.get("bid")),
            ask=to_float(ticker.get("ask")),
            open_24h=to_float(stats.get("open")),
            high_24h=to_float(stats.get("high")),
            low_24h=to_float(stats.get("low")),
            volume_24h=to_float(stats.get("volume")),
        )

    async def candles(self, base: str, currency: str, pair: str, granularity: int, start: datetime, end: datetime) -> CandleSeries:
        if granularity not in GRANULARITIES:
            raise ValueError(f"Unsupported Coinbase granularity {granularity}")
        chunk = timedelta(seconds=granularity * MAX_CANDLES_PER_REQUEST)
        by_time: dict[int, Candle] = {}
        window_end = end
        while window_end > start:
            window_start = max(start, window_end - chunk)
            rows = await get_json(
                self.client,
                SOURCE,
                f"{BASE_URL}/products/{pair}/candles",
                params={
                    "granularity": granularity,
                    "start": window_start.isoformat(),
                    "end": window_end.isoformat(),
                },
            )
            if not isinstance(rows, list):
                raise ProviderError(SOURCE, "bad_data", "Coinbase sent chart data we couldn't read.")
            for row in rows:
                # Coinbase candle rows are [time, low, high, open, close, volume].
                if not isinstance(row, list) or len(row) < 6:
                    continue
                values = [to_float(v) for v in row[1:6]]
                if any(v is None for v in values[:4]):
                    continue
                low, high, open_, close, volume = values
                t = int(row[0])
                by_time[t] = Candle(t, open_, high, low, close, volume)
            window_end = window_start
        return CandleSeries(
            base=base,
            currency=currency,
            pair=pair,
            source=SOURCE,
            interval_seconds=granularity,
            fetched_at=self.clock(),
            candles=[by_time[t] for t in sorted(by_time)],
        )

    async def system_status(self) -> dict:
        data = await get_json(self.client, SOURCE, STATUS_URL)
        status = (data or {}).get("status") or {}
        page = (data or {}).get("page") or {}
        indicator = status.get("indicator")
        mapped = {"none": "ok", "minor": "degraded", "major": "down", "critical": "down"}.get(indicator, "unknown")
        return {
            "status": mapped,
            "description": status.get("description") or "No description given.",
            "reported_at": parse_iso(page.get("updated_at")),
        }
