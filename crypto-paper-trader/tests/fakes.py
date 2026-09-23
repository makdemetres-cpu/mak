"""Fake Coinbase, Kraken, Alpaca and ECB servers.

Reply shapes follow each provider's public API documentation. The tests can
switch a provider off, change its price, or age its last trade.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs

import httpx

NOW = datetime(2026, 9, 23, 12, 0, 10, tzinfo=timezone.utc)


def iso_z(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


@dataclass
class FakeMarkets:
    coinbase_up: bool = True
    kraken_up: bool = True
    alpaca_up: bool = True
    ecb_up: bool = True
    coinbase_rate_limited: bool = False
    prices: dict = field(default_factory=lambda: {
        ("coinbase", "BTC-USD"): 65000.0,
        ("coinbase", "BTC-EUR"): 60200.0,
        ("coinbase", "ETH-USD"): 2500.0,
        ("coinbase", "SOL-USD"): 150.0,
        ("coinbase", "USDT-USD"): 1.0002,
        ("kraken", "XBTUSD"): 65010.0,
        ("kraken", "XBTEUR"): 60190.0,
        ("kraken", "ETHUSD"): 2501.0,
        ("kraken", "SOLUSD"): 150.1,
        ("alpaca", "BTC/USD"): 65020.0,
        ("alpaca", "ETH/USD"): 2499.0,
    })
    trade_age_seconds: float = 2.0
    open_24h: dict = field(default_factory=lambda: {"BTC-USD": 64000.0, "SOL-USD": 150.0, "ETH-USD": 2400.0, "USDT-USD": 1.0})
    usd_per_eur: float = 1.08
    requests: list = field(default_factory=list)

    def transport(self) -> httpx.MockTransport:
        return httpx.MockTransport(self.handle)

    def handle(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(str(request.url))
        host = request.url.host
        if host == "api.exchange.coinbase.com":
            return self._coinbase(request)
        if host == "status.coinbase.com":
            return httpx.Response(200, json={
                "page": {"updated_at": "2026-09-23T11:59:00.000Z"},
                "status": {"indicator": "none", "description": "All Systems Operational"},
            })
        if host == "api.kraken.com":
            return self._kraken(request)
        if host == "data.alpaca.markets":
            return self._alpaca(request)
        if host == "data-api.ecb.europa.eu":
            return self._ecb(request)
        return httpx.Response(404)

    def _trade_time(self) -> datetime:
        return NOW - timedelta(seconds=self.trade_age_seconds)

    def _coinbase(self, request: httpx.Request) -> httpx.Response:
        if not self.coinbase_up:
            raise httpx.ConnectError("down", request=request)
        if self.coinbase_rate_limited:
            return httpx.Response(429, json={"message": "Public rate limit exceeded"})
        path = request.url.path
        if path == "/products":
            return httpx.Response(200, json=[
                {"id": "BTC-USD", "base_currency": "BTC", "quote_currency": "USD", "status": "online", "trading_disabled": False},
                {"id": "BTC-EUR", "base_currency": "BTC", "quote_currency": "EUR", "status": "online", "trading_disabled": False},
                {"id": "ETH-USD", "base_currency": "ETH", "quote_currency": "USD", "status": "online", "trading_disabled": False},
                {"id": "SOL-USD", "base_currency": "SOL", "quote_currency": "USD", "status": "online", "trading_disabled": False},
                {"id": "USDT-USD", "base_currency": "USDT", "quote_currency": "USD", "status": "online", "trading_disabled": False},
                {"id": "BTC-USDC", "base_currency": "BTC", "quote_currency": "USDC", "status": "online", "trading_disabled": False},
                {"id": "OLD-USD", "base_currency": "OLD", "quote_currency": "USD", "status": "delisted", "trading_disabled": True},
            ])
        if path == "/currencies":
            return httpx.Response(200, json=[
                {"id": "BTC", "name": "Bitcoin"}, {"id": "ETH", "name": "Ethereum"}, {"id": "SOL", "name": "Solana"},
                {"id": "USDT", "name": "Tether"}, {"id": "USD", "name": "United States Dollar"}, {"id": "EUR", "name": "Euro"},
            ])
        parts = path.strip("/").split("/")
        if len(parts) == 3 and parts[0] == "products":
            pair, kind = parts[1], parts[2]
            price = self.prices.get(("coinbase", pair))
            if price is None:
                return httpx.Response(404, json={"message": "NotFound"})
            if kind == "ticker":
                return httpx.Response(200, json={
                    "ask": str(price + 1), "bid": str(price - 1), "volume": "12000.5", "trade_id": 1,
                    "price": str(price), "size": "0.01", "time": iso_z(self._trade_time()),
                })
            if kind == "stats":
                return httpx.Response(200, json={
                    "open": str(self.open_24h.get(pair, price)), "high": str(price * 1.02),
                    "low": str(price * 0.97), "last": str(price), "volume": "12000.5", "volume_30day": "400000",
                })
            if kind == "candles":
                q = parse_qs(request.url.query.decode())
                g = int(q["granularity"][0])
                start = datetime.fromisoformat(q["start"][0])
                end = datetime.fromisoformat(q["end"][0])
                rows = []
                t = int(end.timestamp()) // g * g
                while t >= start.timestamp() and len(rows) < 300:
                    rows.append([t, price * 0.99, price * 1.01, price, price * 1.001, 10.5])
                    t -= g
                return httpx.Response(200, json=rows)
        return httpx.Response(404, json={"message": "NotFound"})

    def _kraken(self, request: httpx.Request) -> httpx.Response:
        if not self.kraken_up:
            raise httpx.ConnectError("down", request=request)
        endpoint = request.url.path.rsplit("/", 1)[-1]
        params = parse_qs(request.url.query.decode())
        if endpoint == "AssetPairs":
            return httpx.Response(200, json={"error": [], "result": {
                "XXBTZUSD": {"altname": "XBTUSD", "wsname": "XBT/USD", "base": "XXBT", "quote": "ZUSD", "status": "online"},
                "XXBTZEUR": {"altname": "XBTEUR", "wsname": "XBT/EUR", "base": "XXBT", "quote": "ZEUR", "status": "online"},
                "XETHZUSD": {"altname": "ETHUSD", "wsname": "ETH/USD", "base": "XETH", "quote": "ZUSD", "status": "online"},
                "SOLUSD": {"altname": "SOLUSD", "wsname": "SOL/USD", "base": "SOL", "quote": "ZUSD", "status": "online"},
                "KRONLYUSD": {"altname": "KRONLYUSD", "wsname": "KRONLY/USD", "base": "KRONLY", "quote": "ZUSD", "status": "online"},
                "XXBTZUSD.d": {"altname": "XBTUSD.d", "base": "XXBT", "quote": "ZUSD"},
            }})
        if endpoint == "SystemStatus":
            return httpx.Response(200, json={"error": [], "result": {"status": "online", "timestamp": "2026-09-23T12:00:00Z"}})
        pair = params.get("pair", [""])[0]
        price = self.prices.get(("kraken", pair))
        if price is None:
            return httpx.Response(200, json={"error": ["EQuery:Unknown asset pair"]})
        key = "X" + pair  # the key name doesn't matter to the client, only that there is one
        if endpoint == "Trades":
            return httpx.Response(200, json={"error": [], "result": {
                key: [[str(price), "0.01", self._trade_time().timestamp(), "b", "m", "", 1]], "last": "1"}})
        if endpoint == "Ticker":
            return httpx.Response(200, json={"error": [], "result": {key: {
                "a": [str(price + 1), "1", "1.0"], "b": [str(price - 1), "1", "1.0"], "c": [str(price), "0.01"],
                "v": ["100", "900"], "h": [str(price), str(price * 1.02)], "l": [str(price), str(price * 0.97)], "o": str(price),
            }}})
        if endpoint == "OHLC":
            minutes = int(params["interval"][0])
            step = minutes * 60
            end = int(NOW.timestamp()) // step * step
            rows = [[end - i * step, str(price), str(price * 1.01), str(price * 0.99), str(price), str(price), "5.0", 10]
                    for i in range(720)][::-1]
            return httpx.Response(200, json={"error": [], "result": {key: rows, "last": end}})
        return httpx.Response(200, json={"error": ["EGeneral:Unknown method"]})

    def _alpaca(self, request: httpx.Request) -> httpx.Response:
        if not self.alpaca_up:
            raise httpx.ConnectError("down", request=request)
        symbols = parse_qs(request.url.query.decode()).get("symbols", [""])[0]
        trades = {}
        price = self.prices.get(("alpaca", symbols))
        if price is not None:
            trades[symbols] = {"t": iso_z(self._trade_time()), "p": price, "s": 0.1, "i": 1, "tks": "B"}
        return httpx.Response(200, json={"trades": trades})

    def _ecb(self, request: httpx.Request) -> httpx.Response:
        if not self.ecb_up:
            raise httpx.ConnectError("down", request=request)
        params = parse_qs(request.url.query.decode())
        header = "KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,OBS_STATUS"
        if "lastNObservations" in params:
            dates = ["2026-09-22"]
        else:
            start = datetime.fromisoformat(params["startPeriod"][0]).date()
            end = datetime.fromisoformat(params["endPeriod"][0]).date()
            dates = []
            d = start
            while d <= end:
                if d.weekday() < 5:
                    dates.append(d.isoformat())
                d += timedelta(days=1)
        lines = [header] + [f"EXR.D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,{d},{self.usd_per_eur},A" for d in dates]
        return httpx.Response(200, text="\n".join(lines) + "\n", headers={"Content-Type": "text/csv"})
