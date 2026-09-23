import asyncio
import bisect
import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone

import httpx

from .cache import TimedCache
from .checks import STABLECOIN_PEGS, cross_check, sanity_check_candles, sanity_check_quote
from .freshness import Freshness, FreshnessInfo, classify_quote, classify_series
from .models import SOURCE_NAMES, Candle, CandleSeries, FxRate, Notice, Quote
from .providers.alpaca import AlpacaProvider
from .providers.base import ProviderError
from .providers.coinbase import CoinbaseProvider
from .providers.ecb import EcbProvider
from .providers.kraken import KrakenProvider

log = logging.getLogger(__name__)

CURRENCIES = ("USD", "EUR")
SOURCE_ORDER = ("coinbase", "kraken", "alpaca")
POPULAR = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK", "LTC", "DOT", "USDT", "USDC"]
UNIVERSE_TTL = 15 * 60
PARTIAL_UNIVERSE_TTL = 60
QUOTE_TTL = 5
FX_TTL = 60 * 60
FX_STALE_DAYS = 4


class NotFoundError(Exception):
    pass


class UnavailableError(Exception):
    def __init__(self, message: str, errors: list[dict]):
        super().__init__(message)
        self.errors = errors


@dataclass(frozen=True)
class RangeSpec:
    key: str
    days: int
    coinbase_granularity: int
    kraken_minutes: int
    ttl: int


RANGES = {
    "1D": RangeSpec("1D", 1, 300, 5, 30),
    "1W": RangeSpec("1W", 7, 3600, 60, 120),
    "1M": RangeSpec("1M", 30, 21600, 240, 600),
    "1Y": RangeSpec("1Y", 365, 86400, 1440, 1800),
    "5Y": RangeSpec("5Y", 1826, 86400, 10080, 3600),
}


@dataclass
class Asset:
    symbol: str
    name: str
    coinbase: dict[str, dict] = field(default_factory=dict)
    kraken: dict[str, dict] = field(default_factory=dict)

    def markets(self) -> dict[str, list[str]]:
        return {
            ccy: [src for src, m in (("coinbase", self.coinbase), ("kraken", self.kraken)) if ccy in m]
            for ccy in CURRENCIES
        }


def iso(dt: datetime | None) -> str | None:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z") if dt else None


def local_time(dt: datetime) -> str:
    return dt.astimezone().strftime("%H:%M:%S")


def error_dict(err: ProviderError, at: datetime) -> dict:
    return {"source": err.source, "source_name": err.source_name, "kind": err.kind, "message": str(err), "at": iso(at)}


class MarketService:
    def __init__(
        self,
        client: httpx.AsyncClient,
        *,
        alpaca_key_id: str = "",
        alpaca_secret: str = "",
        clock=lambda: datetime.now(timezone.utc),
    ):
        self.clock = clock
        self.cache = TimedCache(clock)
        self.coinbase = CoinbaseProvider(client, clock)
        self.kraken = KrakenProvider(client, clock)
        self.alpaca = AlpacaProvider(client, alpaca_key_id, alpaca_secret, clock)
        self.ecb = EcbProvider(client, clock)
        self._universe_lock = asyncio.Lock()

    def _cached_universe(self):
        cached = self.cache.fresh("universe", UNIVERSE_TTL)
        if cached and cached[1] and not self.cache.fresh("universe", PARTIAL_UNIVERSE_TTL):
            return None
        return cached

    async def universe(self) -> tuple[dict[str, Asset], list[dict]]:
        cached = self._cached_universe()
        if cached:
            return cached
        async with self._universe_lock:
            cached = self._cached_universe()
            if cached:
                return cached
            now = self.clock()
            products, names, kraken_pairs = await asyncio.gather(
                self.coinbase.products(), self.coinbase.currencies(), self.kraken.asset_pairs(), return_exceptions=True
            )
            errors: list[dict] = []
            for result in (products, names, kraken_pairs):
                if isinstance(result, ProviderError):
                    entry = error_dict(result, now)
                    if not any(e["source"] == entry["source"] and e["message"] == entry["message"] for e in errors):
                        errors.append(entry)
                elif isinstance(result, Exception):
                    raise result

            assets: dict[str, Asset] = {}
            name_map = names if isinstance(names, dict) else {}

            def asset(symbol: str) -> Asset:
                if symbol not in assets:
                    assets[symbol] = Asset(symbol, name_map.get(symbol, symbol))
                return assets[symbol]

            if isinstance(products, list):
                for p in products:
                    base, quote = str(p.get("base_currency", "")).upper(), str(p.get("quote_currency", "")).upper()
                    if quote in CURRENCIES and base and p.get("status") != "delisted":
                        asset(base).coinbase[quote] = {
                            "pair": p.get("id") or f"{base}-{quote}",
                            "status": p.get("status", "online"),
                            "trading_disabled": bool(p.get("trading_disabled")),
                        }
            if isinstance(kraken_pairs, dict):
                for (base, quote), info in kraken_pairs.items():
                    if quote in CURRENCIES and info.get("status") != "delisted":
                        asset(base).kraken[quote] = info

            if not assets:
                previous = self.cache.last("universe")
                if previous:
                    return previous[0][0], errors
                raise UnavailableError("Couldn't load the list of coins from Coinbase or Kraken.", errors)

            value = (assets, errors)
            self.cache.put("universe", value)
            return value

    async def asset(self, symbol: str) -> tuple[Asset, list[Notice]]:
        assets, errors = await self.universe()
        found = assets.get(symbol.upper())
        missing = sorted({e["source_name"] for e in errors})
        if not found:
            if missing:
                raise NotFoundError(
                    f"We couldn't find {symbol.upper()}. {' and '.join(missing)} didn't send its list of coins, "
                    "so the coin may be there. Try again in a minute."
                )
            raise NotFoundError(f"We couldn't find {symbol.upper()} on Coinbase or Kraken.")
        failed_sources = {e["source"] for e in errors}
        notices = [
            Notice(
                "source_missing", "warning",
                f"{SOURCE_NAMES[source]} couldn't be reached, so its prices aren't included here. "
                "We'll try it again within a minute.",
            )
            for source, markets in (("coinbase", found.coinbase), ("kraken", found.kraken))
            if source in failed_sources and not markets
        ]
        return found, notices

    async def search(self, query: str, limit: int = 20) -> dict:
        assets, errors = await self.universe()
        q = query.strip().upper()
        if not q:
            picked = [assets[s] for s in POPULAR if s in assets]
        else:
            scored = []
            for a in assets.values():
                name = a.name.upper()
                if a.symbol == q:
                    score = 0
                elif a.symbol.startswith(q):
                    score = 1
                elif name.startswith(q):
                    score = 2
                elif q in name:
                    score = 3
                elif q in a.symbol:
                    score = 4
                else:
                    continue
                scored.append((score, len(a.symbol), a.symbol, a))
            picked = [a for *_, a in sorted(scored)[:limit]]
        return {
            "results": [{"symbol": a.symbol, "name": a.name, "markets": a.markets()} for a in picked],
            "errors": errors,
        }

    @staticmethod
    def _trade_currency(asset: Asset, currency: str) -> tuple[str, bool]:
        if currency in asset.coinbase or currency in asset.kraken:
            return currency, False
        if currency == "EUR" and ("USD" in asset.coinbase or "USD" in asset.kraken):
            return "USD", True
        raise NotFoundError(f"{asset.symbol} has no {currency} or USD market on Coinbase or Kraken.")

    async def fx_latest(self) -> tuple[FxRate | None, dict | None]:
        cached = self.cache.fresh("fx_latest", FX_TTL)
        if cached:
            return cached, None
        try:
            rate = await self.ecb.latest()
        except ProviderError as err:
            previous = self.cache.last("fx_latest")
            return (previous[0] if previous else None), error_dict(err, self.clock())
        self.cache.put("fx_latest", rate)
        return rate, None

    async def _fetch_quote(self, source: str, asset: Asset, trade_ccy: str, with_stats: bool) -> Quote:
        if source == "coinbase":
            return await self.coinbase.quote(asset.symbol, trade_ccy, asset.coinbase[trade_ccy]["pair"])
        if source == "kraken":
            return await self.kraken.quote(asset.symbol, trade_ccy, asset.kraken[trade_ccy]["pair"], with_stats=with_stats)
        return await self.alpaca.quote(asset.symbol, trade_ccy, f"{asset.symbol}/{trade_ccy}")

    async def quote_report(self, symbol: str, currency: str) -> dict:
        currency = currency.upper()
        if currency not in CURRENCIES:
            raise NotFoundError(f"Currency {currency} isn't supported. Use USD or EUR.")
        asset, notices = await self.asset(symbol)
        trade_ccy, converted = self._trade_currency(asset, currency)
        now = self.clock()

        sources = []
        if trade_ccy in asset.coinbase:
            sources.append("coinbase")
        if trade_ccy in asset.kraken:
            sources.append("kraken")
        if trade_ccy == "USD":
            sources.append("alpaca")

        async def run(source: str):
            key = ("quote", source, asset.symbol, trade_ccy)
            cached = self.cache.fresh(key, QUOTE_TTL)
            if cached:
                return cached
            quote = await self._fetch_quote(source, asset, trade_ccy, with_stats="coinbase" not in sources)
            self.cache.put(key, quote)
            return quote

        results = await asyncio.gather(*(run(s) for s in sources), return_exceptions=True)
        fresh: dict[str, Quote] = {}
        errors: list[dict] = []
        not_listed: list[str] = []
        for source, result in zip(sources, results):
            if isinstance(result, Quote):
                fresh[source] = result
            elif isinstance(result, ProviderError):
                if result.kind == "not_listed" and source == "alpaca":
                    not_listed.append(source)
                else:
                    errors.append(error_dict(result, now))
            else:
                log.error("Unexpected error from %s", source, exc_info=result)
                errors.append({"source": source, "source_name": SOURCE_NAMES[source], "kind": "bug",
                               "message": f"Something went wrong reading {SOURCE_NAMES[source]}.", "at": iso(now)})

        primary: Quote | None = next((fresh[s] for s in SOURCE_ORDER if s in fresh), None)
        from_cache = False
        if primary is None:
            candidates = [self.cache.last(("quote", s, asset.symbol, trade_ccy)) for s in sources]
            candidates = [c for c in candidates if c]
            if candidates:
                primary = max(candidates, key=lambda c: c[1])[0]
                from_cache = True
                notices.append(Notice(
                    "refresh_failed", "danger",
                    f"Couldn't refresh the price at {local_time(now)}. "
                    f"Showing the last price we got, from {local_time(primary.fetched_at)}.",
                ))
        elif sources and primary.source != sources[0]:
            notices.append(Notice(
                "fallback_source", "warning",
                f"{SOURCE_NAMES[sources[0]]} didn't answer at {local_time(now)}, so this price is from {primary.source_name}.",
            ))

        pair_info = asset.coinbase.get(trade_ccy) or {}
        if pair_info and (pair_info.get("status") != "online" or pair_info.get("trading_disabled")):
            notices.append(Notice(
                "market_paused", "warning",
                f"Coinbase has limited trading in {pair_info['pair']} (status: {pair_info.get('status')}).",
            ))

        fx, fx_error = (None, None)
        peg = STABLECOIN_PEGS.get(asset.symbol)
        if converted or (peg and peg != currency):
            fx, fx_error = await self.fx_latest()
            if fx_error:
                errors.append(fx_error)

        factor = 1.0
        fx_info = None
        if converted:
            if fx is None:
                notices.append(Notice(
                    "no_fx", "danger",
                    "Couldn't get the euro exchange rate, so no euro price is shown. Switch to USD to see the dollar price.",
                ))
                primary = None
            else:
                factor = 1.0 / fx.rate
                fx_info = self._fx_info(fx, now)
                notices.append(Notice(
                    "converted", "info",
                    f"Neither Coinbase nor Kraken has a euro market for {asset.symbol}. "
                    f"This is the US dollar price converted at the ECB reference rate for {fx.rate_date} "
                    f"(1 EUR = {fx.rate:.4f} USD), so treat it as an estimate.",
                ))
                if fx_info["stale"]:
                    notices.append(Notice("fx_stale", "warning", f"The newest ECB rate is from {fx.rate_date}, which is older than usual."))

        if primary is None:
            return {
                "symbol": asset.symbol, "name": asset.name, "currency": currency, "converted": converted,
                "price": None, "source": None,
                "freshness": FreshnessInfo(Freshness.UNAVAILABLE, None, "No price is available right now.").as_dict(),
                "cross_check": {"status": "unchecked", "threshold_pct": None, "comparisons": []},
                "fx": fx_info, "notices": [n.as_dict() for n in notices], "errors": errors, "checked_at": iso(now),
            }

        expected_peg = None
        if peg == currency:
            expected_peg = 1.0
        elif peg == "USD" and currency == "EUR" and fx:
            expected_peg = 1.0 / fx.rate
        elif peg == "EUR" and currency == "USD" and fx:
            expected_peg = fx.rate
        display = self._scaled(primary, factor)
        notices.extend(sanity_check_quote(display, expected_peg))

        others = [q for s, q in fresh.items() if s != primary.source]
        check = cross_check(primary, others)
        check_dict = check.as_dict()
        for comp in check_dict["comparisons"]:
            if comp["price"] is not None:
                comp["price"] *= factor
        for source in not_listed:
            check_dict["comparisons"].append({
                "source": source, "source_name": SOURCE_NAMES[source], "price": None, "diff_pct": None,
                "comparable": False, "note": f"{SOURCE_NAMES[source]} doesn't list this coin.",
            })
        if check.status == "disagree":
            worst = max((c for c in check.comparisons if c.diff_pct is not None), key=lambda c: c.diff_pct)
            notices.append(Notice(
                "sources_disagree", "warning",
                f"{primary.source_name} and {worst.source_name} disagree by {worst.diff_pct:.2f}%. "
                "One of them may be wrong or lagging. Be careful using this price.",
            ))

        freshness = classify_quote(primary.observed_at, now, delay_seconds=primary.delay_seconds, refresh_failed=from_cache)
        change = None
        if display.open_24h and display.price:
            change = (display.price / display.open_24h - 1) * 100

        return {
            "symbol": asset.symbol,
            "name": asset.name,
            "currency": currency,
            "converted": converted,
            "price": None if display.price is None or display.price <= 0 else {
                "value": display.price,
                "bid": display.bid,
                "ask": display.ask,
                "open_24h": display.open_24h,
                "high_24h": display.high_24h,
                "low_24h": display.low_24h,
                "change_24h_pct": change,
                "volume_24h": display.volume_24h,
            },
            "source": {
                "id": primary.source,
                "name": primary.source_name,
                "pair": primary.pair,
                "observed_at": iso(primary.observed_at),
                "fetched_at": iso(primary.fetched_at),
                "from_cache": from_cache,
            },
            "freshness": freshness.as_dict(),
            "cross_check": check_dict,
            "fx": fx_info,
            "notices": [n.as_dict() for n in notices],
            "errors": errors,
            "checked_at": iso(now),
        }

    @staticmethod
    def _scaled(q: Quote, factor: float) -> Quote:
        if factor == 1.0:
            return q

        def s(v):
            return None if v is None else v * factor

        return Quote(q.base, q.currency, s(q.price), q.source, q.fetched_at, q.observed_at, q.pair,
                     s(q.bid), s(q.ask), s(q.open_24h), s(q.high_24h), s(q.low_24h), q.volume_24h, q.delay_seconds)

    def _fx_info(self, fx: FxRate, now: datetime) -> dict:
        age_days = (now.date() - date.fromisoformat(fx.rate_date)).days
        return {
            "rate_usd_per_eur": fx.rate,
            "rate_date": fx.rate_date,
            "source": fx.source,
            "source_name": SOURCE_NAMES[fx.source],
            "fetched_at": iso(fx.fetched_at),
            "stale": age_days > FX_STALE_DAYS,
        }

    async def _fetch_series(self, source: str, asset: Asset, trade_ccy: str, spec: RangeSpec, start: datetime, end: datetime) -> CandleSeries:
        if source == "coinbase":
            return await self.coinbase.candles(
                asset.symbol, trade_ccy, asset.coinbase[trade_ccy]["pair"], spec.coinbase_granularity, start, end
            )
        return await self.kraken.candles(asset.symbol, trade_ccy, asset.kraken[trade_ccy]["pair"], spec.kraken_minutes, start)

    async def candles_report(self, symbol: str, currency: str, range_key: str) -> dict:
        currency = currency.upper()
        if currency not in CURRENCIES:
            raise NotFoundError(f"Currency {currency} isn't supported. Use USD or EUR.")
        spec = RANGES.get(range_key.upper())
        if spec is None:
            raise NotFoundError(f"Unknown chart range {range_key}. Use one of {', '.join(RANGES)}.")
        asset, notices = await self.asset(symbol)
        trade_ccy, converted = self._trade_currency(asset, currency)
        now = self.clock()
        start = now - timedelta(days=spec.days)

        key = ("candles", asset.symbol, trade_ccy, spec.key)
        series: CandleSeries | None = self.cache.fresh(key, spec.ttl)
        errors: list[dict] = []
        refresh_failed = False
        if series is None:
            for source in ("coinbase", "kraken"):
                markets = asset.coinbase if source == "coinbase" else asset.kraken
                if trade_ccy not in markets:
                    continue
                try:
                    series = await self._fetch_series(source, asset, trade_ccy, spec, start, now)
                    break
                except ProviderError as err:
                    errors.append(error_dict(err, now))
            if series is not None:
                self.cache.put(key, series)
                if errors:
                    notices.append(Notice(
                        "fallback_source", "warning",
                        f"{errors[0]['source_name']} didn't answer, so this chart is from {SOURCE_NAMES[series.source]}.",
                    ))
            else:
                previous = self.cache.last(key)
                if previous:
                    series, refresh_failed = previous[0], True
                    notices.append(Notice(
                        "refresh_failed", "danger",
                        f"Couldn't refresh the chart at {local_time(now)}. Showing the chart we got at {local_time(previous[1])}.",
                    ))

        if series is None:
            return self._empty_series(asset, currency, spec, converted, notices, errors, now)

        candles, candle_notices = sanity_check_candles(series.candles)
        notices.extend(candle_notices)

        fx_note = None
        if converted:
            converted_candles, fx_note, fx_error = await self._convert_candles(candles, start, now)
            if fx_error:
                errors.append(fx_error)
            if converted_candles is None:
                notices.append(Notice(
                    "no_fx", "danger", "Couldn't get euro exchange rates, so no euro chart is shown. Switch to USD to see it."
                ))
                return self._empty_series(asset, currency, spec, converted, notices, errors, now)
            candles = converted_candles
            notices.append(Notice("converted", "info", fx_note))

        freshness = classify_series(candles[-1].time if candles else None, series.interval_seconds, now, refresh_failed=refresh_failed)
        return {
            "symbol": asset.symbol,
            "currency": currency,
            "range": spec.key,
            "converted": converted,
            "interval_seconds": series.interval_seconds,
            "source": {
                "id": series.source,
                "name": SOURCE_NAMES[series.source],
                "pair": series.pair,
                "fetched_at": iso(series.fetched_at),
                "from_cache": refresh_failed,
            },
            "candles": [c.__dict__ for c in candles],
            "freshness": freshness.as_dict(),
            "notices": [n.as_dict() for n in notices],
            "errors": errors,
            "checked_at": iso(now),
        }

    def _empty_series(self, asset, currency, spec, converted, notices, errors, now) -> dict:
        return {
            "symbol": asset.symbol, "currency": currency, "range": spec.key, "converted": converted,
            "interval_seconds": None, "source": None, "candles": [],
            "freshness": classify_series(None, 0, now).as_dict(),
            "notices": [n.as_dict() for n in notices], "errors": errors, "checked_at": iso(now),
        }

    async def _convert_candles(self, candles: list[Candle], start: datetime, now: datetime):
        key = ("fx_history", start.date().isoformat())
        rates: list[FxRate] | None = self.cache.fresh(key, 6 * 3600)
        error = None
        if rates is None:
            try:
                rates = await self.ecb.history(start.date() - timedelta(days=10), now.date())
                self.cache.put(key, rates)
            except ProviderError as err:
                error = error_dict(err, now)
                previous = self.cache.last(key)
                rates = previous[0] if previous else None
        if not rates:
            return None, None, error

        dates = [r.rate_date for r in rates]
        out: list[Candle] = []
        for c in candles:
            day = datetime.fromtimestamp(c.time, tz=timezone.utc).date().isoformat()
            i = bisect.bisect_right(dates, day) - 1
            rate = rates[max(i, 0)].rate
            out.append(Candle(c.time, c.open / rate, c.high / rate, c.low / rate, c.close / rate, c.volume))
        note = (
            "Neither Coinbase nor Kraken has a euro market for this coin. The chart is US dollar prices converted "
            f"with each day's ECB reference rate (newest: {rates[-1].rate_date}), so treat it as an estimate."
        )
        return out, note, error

    async def exchange_status(self) -> list[dict]:
        now = self.clock()
        out = []
        for source, provider in (("coinbase", self.coinbase), ("kraken", self.kraken)):
            key = ("status", source)
            cached = self.cache.fresh(key, 60)
            if cached:
                out.append(cached)
                continue
            try:
                result = await provider.system_status()
                entry = {
                    "source": source, "source_name": SOURCE_NAMES[source], "status": result["status"],
                    "description": result["description"], "reported_at": iso(result["reported_at"]),
                    "checked_at": iso(now), "error": None,
                }
                self.cache.put(key, entry)
            except ProviderError as err:
                entry = {
                    "source": source, "source_name": SOURCE_NAMES[source], "status": "unknown",
                    "description": "We couldn't check this exchange's status.", "reported_at": None,
                    "checked_at": iso(now), "error": str(err),
                }
            out.append(entry)
        return out
