from datetime import datetime, timedelta, timezone

from server.market.freshness import Freshness, classify_quote, classify_series, human_duration

NOW = datetime(2026, 9, 23, 12, 0, 0, tzinfo=timezone.utc)


def test_recent_trade_is_live():
    info = classify_quote(NOW - timedelta(seconds=3), NOW)
    assert info.status is Freshness.LIVE
    assert info.detail == "Last trade 3 seconds ago."


def test_old_trade_is_stale():
    info = classify_quote(NOW - timedelta(minutes=12), NOW)
    assert info.status is Freshness.STALE
    assert "12 minutes ago" in info.detail


def test_refresh_failure_is_stale_even_when_recent():
    info = classify_quote(NOW - timedelta(seconds=20), NOW, refresh_failed=True)
    assert info.status is Freshness.STALE
    assert info.detail.startswith("Couldn't refresh")


def test_missing_time_is_unavailable():
    info = classify_quote(None, NOW)
    assert info.status is Freshness.UNAVAILABLE
    assert info.age_seconds is None


def test_declared_delay_is_labeled_delayed():
    info = classify_quote(NOW - timedelta(seconds=10), NOW, delay_seconds=900)
    assert info.status is Freshness.DELAYED
    assert "15 minutes" in info.detail


def test_future_timestamp_is_not_trusted():
    info = classify_quote(NOW + timedelta(minutes=5), NOW)
    assert info.status is Freshness.STALE
    assert "clock" in info.detail


def test_series_with_recent_point_is_live():
    last = int((NOW - timedelta(minutes=3)).timestamp())
    assert classify_series(last, 300, NOW).status is Freshness.LIVE


def test_series_with_old_point_is_stale():
    last = int((NOW - timedelta(hours=3)).timestamp())
    assert classify_series(last, 300, NOW).status is Freshness.STALE


def test_daily_series_is_end_of_day():
    last = int(NOW.replace(hour=0).timestamp())
    info = classify_series(last, 86400, NOW)
    assert info.status is Freshness.END_OF_DAY
    assert "per day" in info.detail


def test_weekly_series_says_week():
    last = int((NOW - timedelta(days=3)).timestamp())
    assert "per week" in classify_series(last, 7 * 86400, NOW).detail


def test_empty_series_is_unavailable():
    assert classify_series(None, 300, NOW).status is Freshness.UNAVAILABLE


def test_human_duration():
    assert human_duration(1) == "1 second"
    assert human_duration(59) == "59 seconds"
    assert human_duration(60) == "1 minute"
    assert human_duration(7200) == "2 hours"
    assert human_duration(86400 * 3) == "3 days"
