from datetime import datetime, timedelta, timezone

from server.market.checks import cross_check, sanity_check_candles, sanity_check_quote
from server.market.models import Candle, Quote

NOW = datetime(2026, 9, 23, 12, 0, 0, tzinfo=timezone.utc)


def quote(price, source="coinbase", age=0, **kw):
    return Quote("BTC", "USD", price, source, NOW, NOW - timedelta(seconds=age), "BTC-USD", **kw)


def codes(notices):
    return {n.code for n in notices}


def test_impossible_price_is_flagged():
    assert "impossible_price" in codes(sanity_check_quote(quote(-5)))
    assert "impossible_price" in codes(sanity_check_quote(quote(0)))


def test_missing_price_is_flagged():
    assert "missing_price" in codes(sanity_check_quote(quote(None)))


def test_normal_quote_has_no_warnings():
    assert sanity_check_quote(quote(65000, volume_24h=100, open_24h=64000)) == []


def test_missing_and_zero_volume():
    assert "missing_volume" in codes(sanity_check_quote(quote(65000)))
    assert "zero_volume" in codes(sanity_check_quote(quote(65000, volume_24h=0)))


def test_unusual_move_is_flagged():
    notices = sanity_check_quote(quote(10, volume_24h=5, open_24h=100))
    assert "unusual_move" in codes(notices)
    assert "-90.0%" in notices[0].message


def test_depeg_is_flagged():
    assert "depeg" in codes(sanity_check_quote(quote(0.95, volume_24h=5), expected_peg_price=1.0))
    assert "depeg" not in codes(sanity_check_quote(quote(0.999, volume_24h=5), expected_peg_price=1.0))


def test_cross_check_agree():
    result = cross_check(quote(65000), [quote(65010, "kraken")])
    assert result.status == "agree"
    assert result.comparisons[0].diff_pct < 0.02


def test_cross_check_disagree():
    result = cross_check(quote(65000), [quote(66000, "kraken")])
    assert result.status == "disagree"


def test_cross_check_skips_trades_far_apart_in_time():
    result = cross_check(quote(65000), [quote(70000, "kraken", age=600)])
    assert result.status == "unchecked"
    assert not result.comparisons[0].comparable


def test_cross_check_with_no_others():
    assert cross_check(quote(65000), []).status == "unchecked"


def test_invalid_candles_are_dropped_and_reported():
    candles = [
        Candle(1, 10, 11, 9, 10.5, 1),
        Candle(2, 10, 9, 11, 10, 1),
        Candle(3, -1, 11, 9, 10, 1),
        Candle(4, 10, 11, 9, 12, 1),
        Candle(5, 10, 11, 9, 10, None),
    ]
    clean, notices = sanity_check_candles(candles)
    assert [c.time for c in clean] == [1, 5]
    assert "3 chart points" in notices[0].message
    assert "missing_volume" in codes(notices)


def test_big_jump_in_candles_is_flagged():
    candles = [Candle(0, 100, 101, 99, 100, 1), Candle(86400, 100, 200, 99, 190, 1)]
    _, notices = sanity_check_candles(candles)
    assert "unusual_jump" in codes(notices)
    assert "1970-01-02" in notices[0].message
