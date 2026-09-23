import asyncio
from datetime import timedelta

import pytest

from server.http import make_client
from server.market.service import MarketService, NotFoundError

from .fakes import NOW, FakeMarkets


class Clock:
    def __init__(self):
        self.now = NOW

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += timedelta(seconds=seconds)


def make(fake: FakeMarkets | None = None):
    fake = fake or FakeMarkets()
    clock = Clock()
    service = MarketService(make_client(fake.transport(), throttle=False), clock=clock)
    return service, fake, clock


def run(coro):
    return asyncio.run(coro)


def notice_codes(report):
    return {n["code"] for n in report["notices"]}


def test_quote_uses_coinbase_and_cross_checks_others():
    service, _, _ = make()
    report = run(service.quote_report("btc", "USD"))
    assert report["source"]["id"] == "coinbase"
    assert report["price"]["value"] == 65000.0
    assert report["freshness"]["status"] == "live"
    assert report["cross_check"]["status"] == "agree"
    assert {c["source"] for c in report["cross_check"]["comparisons"]} == {"kraken", "alpaca"}
    assert report["price"]["change_24h_pct"] == pytest.approx(1.5625)
    assert report["errors"] == []


def test_disagreeing_sources_raise_a_warning():
    fake = FakeMarkets()
    fake.prices[("kraken", "XBTUSD")] = 67000.0
    service, _, _ = make(fake)
    report = run(service.quote_report("BTC", "USD"))
    assert report["cross_check"]["status"] == "disagree"
    assert "sources_disagree" in notice_codes(report)


def test_coinbase_down_falls_back_to_kraken_and_says_so():
    service, fake, _ = make()
    run(service.universe())
    fake.coinbase_up = False
    report = run(service.quote_report("BTC", "USD"))
    assert report["source"]["id"] == "kraken"
    assert "fallback_source" in notice_codes(report)
    assert any(e["source"] == "coinbase" and e["kind"] == "network" for e in report["errors"])


def test_rate_limit_is_reported_plainly():
    service, fake, _ = make()
    run(service.universe())
    fake.coinbase_rate_limited = True
    report = run(service.quote_report("BTC", "USD"))
    assert any(e["kind"] == "rate_limited" for e in report["errors"])


def test_all_sources_down_shows_cached_price_as_stale():
    service, fake, clock = make()
    run(service.quote_report("BTC", "USD"))
    fake.coinbase_up = fake.kraken_up = fake.alpaca_up = False
    clock.advance(60)
    report = run(service.quote_report("BTC", "USD"))
    assert report["price"]["value"] == 65000.0
    assert report["source"]["from_cache"] is True
    assert report["freshness"]["status"] == "stale"
    assert "refresh_failed" in notice_codes(report)
    assert len(report["errors"]) == 3


def test_all_sources_down_with_nothing_cached_shows_no_price():
    service, fake, _ = make()
    run(service.universe())
    fake.coinbase_up = fake.kraken_up = fake.alpaca_up = False
    report = run(service.quote_report("BTC", "USD"))
    assert report["price"] is None
    assert report["freshness"]["status"] == "unavailable"


def test_old_last_trade_is_stale():
    fake = FakeMarkets(trade_age_seconds=900)
    service, _, _ = make(fake)
    report = run(service.quote_report("BTC", "USD"))
    assert report["freshness"]["status"] == "stale"


def test_eur_uses_native_euro_market_when_it_exists():
    service, _, _ = make()
    report = run(service.quote_report("BTC", "EUR"))
    assert report["converted"] is False
    assert report["source"]["pair"] == "BTC-EUR"
    assert report["price"]["value"] == 60200.0
    assert report["fx"] is None
    assert {c["source"] for c in report["cross_check"]["comparisons"]} == {"kraken"}


def test_eur_converts_with_ecb_rate_when_no_euro_market():
    service, _, _ = make()
    report = run(service.quote_report("ETH", "EUR"))
    assert report["converted"] is True
    assert report["price"]["value"] == pytest.approx(2500.0 / 1.08)
    assert report["fx"]["rate_date"] == "2026-09-22"
    assert report["fx"]["source"] == "ecb"
    assert "converted" in notice_codes(report)
    kraken = next(c for c in report["cross_check"]["comparisons"] if c["source"] == "kraken")
    assert kraken["price"] == pytest.approx(2501.0 / 1.08)


def test_eur_conversion_without_ecb_shows_no_price():
    fake = FakeMarkets(ecb_up=False)
    service, _, _ = make(fake)
    report = run(service.quote_report("ETH", "EUR"))
    assert report["price"] is None
    assert "no_fx" in notice_codes(report)
    assert any(e["source"] == "ecb" for e in report["errors"])


def test_stablecoin_depeg_checked_in_euros():
    fake = FakeMarkets()
    fake.prices[("coinbase", "USDT-USD")] = 0.95
    service, _, _ = make(fake)
    report = run(service.quote_report("USDT", "EUR"))
    assert "depeg" in notice_codes(report)


def test_unknown_coin_is_not_found():
    service, _, _ = make()
    with pytest.raises(NotFoundError):
        run(service.quote_report("NOPE", "USD"))


def test_candles_from_coinbase():
    service, _, _ = make()
    report = run(service.candles_report("BTC", "USD", "1D"))
    assert report["source"]["id"] == "coinbase"
    assert report["interval_seconds"] == 300
    assert len(report["candles"]) >= 288
    times = [c["time"] for c in report["candles"]]
    assert times == sorted(times)
    assert report["freshness"]["status"] == "live"


def test_five_year_chart_pages_through_coinbase_limit():
    service, fake, _ = make()
    report = run(service.candles_report("BTC", "USD", "5Y"))
    assert len(report["candles"]) > 1800
    assert sum("/candles" in u for u in fake.requests) == 7
    assert report["freshness"]["status"] == "end_of_day"


def test_candles_fall_back_to_kraken():
    service, fake, _ = make()
    run(service.universe())
    fake.coinbase_up = False
    report = run(service.candles_report("BTC", "USD", "1W"))
    assert report["source"]["id"] == "kraken"
    assert report["interval_seconds"] == 3600
    assert "fallback_source" in notice_codes(report)
    assert min(c["time"] for c in report["candles"]) >= (NOW - timedelta(days=7)).timestamp()


def test_candles_converted_to_eur():
    service, _, _ = make()
    report = run(service.candles_report("ETH", "EUR", "1M"))
    assert report["converted"] is True
    assert report["candles"][-1]["open"] == pytest.approx(2500.0 / 1.08)


def test_candles_refresh_failure_serves_cache_as_stale():
    service, fake, clock = make()
    run(service.candles_report("BTC", "USD", "1D"))
    fake.coinbase_up = fake.kraken_up = False
    clock.advance(3600)
    report = run(service.candles_report("BTC", "USD", "1D"))
    assert report["freshness"]["status"] == "stale"
    assert "refresh_failed" in notice_codes(report)


def test_search_ranks_exact_symbol_first_and_merges_exchanges():
    service, _, _ = make()
    result = run(service.search("sol"))
    assert result["results"][0]["symbol"] == "SOL"
    assert result["results"][0]["name"] == "Solana"
    btc = run(service.search("bitcoin"))["results"][0]
    assert btc["markets"] == {"USD": ["coinbase", "kraken"], "EUR": ["coinbase", "kraken"]}


def test_search_skips_delisted_and_includes_kraken_only():
    service, _, _ = make()
    assert run(service.search("OLD"))["results"] == []
    assert run(service.search("KRONLY"))["results"][0]["markets"]["USD"] == ["kraken"]


def test_search_reports_partial_universe():
    service, fake, _ = make()
    fake.kraken_up = False
    result = run(service.search("btc"))
    assert result["results"][0]["symbol"] == "BTC"
    assert any(e["source"] == "kraken" for e in result["errors"])


def test_exchange_status():
    service, fake, _ = make()
    fake.kraken_up = False
    statuses = {s["source"]: s for s in run(service.exchange_status())}
    assert statuses["coinbase"]["status"] == "ok"
    assert statuses["kraken"]["status"] == "unknown"


def test_coin_page_says_when_a_source_list_is_missing():
    fake = FakeMarkets(coinbase_up=False)
    service, _, clock = make(fake)
    report = run(service.quote_report("BTC", "USD"))
    assert report["source"]["id"] == "kraken"
    assert "source_missing" in notice_codes(report)
    fake.coinbase_up = True
    clock.advance(61)
    report = run(service.quote_report("BTC", "USD"))
    assert report["source"]["id"] == "coinbase"
    assert "source_missing" not in notice_codes(report)


def test_not_found_mentions_unreachable_source():
    fake = FakeMarkets(kraken_up=False)
    service, _, _ = make(fake)
    with pytest.raises(NotFoundError, match="Kraken"):
        run(service.quote_report("KRONLY", "USD"))
