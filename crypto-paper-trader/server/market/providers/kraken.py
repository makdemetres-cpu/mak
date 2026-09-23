from datetime import datetime, timezone

import httpx

from ..models import Candle, CandleSeries, Quote
from .base import ProviderError, get_json, parse_iso, to_float

BASE_URL = "https://api.kraken.com/0/public"
SOURCE = "kraken"
MAX_CANDLES = 720
INTERVAL_MINUTES = {1, 5, 15, 30, 60, 240, 1440, 10080, 21600}
KRAKEN_TO_COMMON = {"XBT": "BTC", "XDG": "DOGE"}


def common_symbol(kraken_symbol: str) -> str:
    return KRAKEN_TO_COMMON.get(kraken_symbol.upper(), kraken_symbol.upper())


class KrakenProvider:
    source = SOURCE

    def __init__(self, client: httpx.AsyncClient, clock=lambda: datetime.now(timezone.utc)):
        self.client = client
        self.clock = clock

    async def _result(self, path: str, params: dict | None = None):
        data = await get_json(self.client, SOURCE, f"{BASE_URL}/{path}", params=params)
        if not isinstance(data, dict):
            raise ProviderError(SOURCE, "bad_data", "Kraken sent a reply we couldn't read.")
        errors = data.get("error") or []
        if errors:
            text = "; ".join(str(e) for e in errors)
            if "Unknown asset pair" in text:
                raise ProviderError(SOURCE, "not_listed", "Kraken doesn't have this market.")
            if "Rate limit" in text or "Too many requests" in text:
                raise ProviderError(SOURCE, "rate_limited", "Kraken asked us to slow down (rate limit). We'll retry shortly.")
            if "Unavailable" in text or "Busy" in text:
                raise ProviderError(SOURCE, "http", "Kraken is temporarily unavailable.")
            raise ProviderError(SOURCE, "http", f"Kraken returned an error: {text}")
        result = data.get("result")
        if result is None:
            raise ProviderError(SOURCE, "bad_data", "Kraken sent a reply with no result.")
        return result

    @staticmethod
    def _single_market(result: dict):
        for key, value in result.items():
            if key != "last":
                return value
        raise ProviderError(SOURCE, "bad_data", "Kraken's reply had no market data.")

    async def asset_pairs(self) -> dict[tuple[str, str], dict]:
        result = await self._result("AssetPairs")
        pairs: dict[tuple[str, str], dict] = {}
        for info in result.values():
            wsname = info.get("wsname")
            if not wsname or "/" not in wsname:
                continue
            base, quote = wsname.split("/", 1)
            pairs[(common_symbol(base), common_symbol(quote))] = {
                "pair": info.get("altname") or wsname.replace("/", ""),
                "status": info.get("status", "online"),
            }
        return pairs

    async def quote(self, base: str, currency: str, pair: str, with_stats: bool = False) -> Quote:
        trades = self._single_market(await self._result("Trades", {"pair": pair, "count": 1}))
        if not isinstance(trades, list) or not trades:
            raise ProviderError(SOURCE, "bad_data", "Kraken sent no recent trades.")
        last = trades[-1]
        observed = datetime.fromtimestamp(float(last[2]), tz=timezone.utc)
        quote = Quote(
            base=base,
            currency=currency,
            price=to_float(last[0]),
            source=SOURCE,
            fetched_at=self.clock(),
            observed_at=observed,
            pair=pair,
        )
        if with_stats:
            ticker = self._single_market(await self._result("Ticker", {"pair": pair}))
            quote.bid = to_float((ticker.get("b") or [None])[0])
            quote.ask = to_float((ticker.get("a") or [None])[0])
            quote.high_24h = to_float((ticker.get("h") or [None, None])[1])
            quote.low_24h = to_float((ticker.get("l") or [None, None])[1])
            quote.volume_24h = to_float((ticker.get("v") or [None, None])[1])
        return quote

    async def candles(self, base: str, currency: str, pair: str, interval_minutes: int, start: datetime) -> CandleSeries:
        if interval_minutes not in INTERVAL_MINUTES:
            raise ValueError(f"Unsupported Kraken interval {interval_minutes}")
        rows = self._single_market(
            await self._result("OHLC", {"pair": pair, "interval": interval_minutes, "since": int(start.timestamp())})
        )
        candles: list[Candle] = []
        start_ts = int(start.timestamp())
        for row in rows if isinstance(rows, list) else []:
            # Kraken OHLC rows are [time, open, high, low, close, vwap, volume, count].
            if not isinstance(row, list) or len(row) < 7:
                continue
            values = [to_float(v) for v in row[1:5]]
            if any(v is None for v in values):
                continue
            t = int(row[0])
            if t < start_ts:
                continue
            open_, high, low, close = values
            candles.append(Candle(t, open_, high, low, close, to_float(row[6])))
        return CandleSeries(
            base=base,
            currency=currency,
            pair=pair,
            source=SOURCE,
            interval_seconds=interval_minutes * 60,
            fetched_at=self.clock(),
            candles=sorted(candles, key=lambda c: c.time),
        )

    async def system_status(self) -> dict:
        result = await self._result("SystemStatus")
        raw = str(result.get("status", "")).lower()
        mapped = {
            "online": "ok",
            "maintenance": "down",
            "cancel_only": "degraded",
            "post_only": "degraded",
            "limit_only": "degraded",
            "reduce_only": "degraded",
        }.get(raw, "unknown")
        descriptions = {
            "online": "Trading normally.",
            "maintenance": "Down for maintenance.",
            "cancel_only": "Only order cancellations are allowed right now.",
            "post_only": "Only limit orders that add liquidity are allowed right now.",
            "limit_only": "Only limit orders are allowed right now.",
            "reduce_only": "Only orders that reduce positions are allowed right now.",
        }
        return {
            "status": mapped,
            "description": descriptions.get(raw, f"Kraken reports status '{raw}'."),
            "reported_at": parse_iso(result.get("timestamp")),
        }
