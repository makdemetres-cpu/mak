from dataclasses import dataclass
from datetime import datetime
from enum import Enum

QUOTE_STALE_AFTER_SECONDS = 5 * 60
FUTURE_TOLERANCE_SECONDS = 30


class Freshness(str, Enum):
    LIVE = "live"
    DELAYED = "delayed"
    END_OF_DAY = "end_of_day"
    STALE = "stale"
    UNAVAILABLE = "unavailable"


LABELS = {
    Freshness.LIVE: "Live",
    Freshness.DELAYED: "Delayed",
    Freshness.END_OF_DAY: "End of day",
    Freshness.STALE: "Stale",
    Freshness.UNAVAILABLE: "No data",
}


@dataclass(frozen=True)
class FreshnessInfo:
    status: Freshness
    age_seconds: float | None
    detail: str

    def as_dict(self) -> dict:
        return {
            "status": self.status.value,
            "label": LABELS[self.status],
            "age_seconds": None if self.age_seconds is None else round(self.age_seconds, 1),
            "detail": self.detail,
        }


def human_duration(seconds: float) -> str:
    seconds = max(0, int(round(seconds)))
    for unit, size in (("day", 86400), ("hour", 3600), ("minute", 60)):
        if seconds >= size:
            n = seconds // size
            return f"{n} {unit}{'' if n == 1 else 's'}"
    return f"{seconds} second{'' if seconds == 1 else 's'}"


def _age(observed_at: datetime, now: datetime) -> tuple[float, bool]:
    age = (now - observed_at).total_seconds()
    clock_skew = age < -FUTURE_TOLERANCE_SECONDS
    return max(age, 0.0), clock_skew


def classify_quote(
    observed_at: datetime | None,
    now: datetime,
    *,
    delay_seconds: int = 0,
    stale_after: int = QUOTE_STALE_AFTER_SECONDS,
    refresh_failed: bool = False,
) -> FreshnessInfo:
    if observed_at is None:
        return FreshnessInfo(Freshness.UNAVAILABLE, None, "No price with a known time is available.")

    age, clock_skew = _age(observed_at, now)
    ago = human_duration(age)

    if clock_skew:
        return FreshnessInfo(
            Freshness.STALE,
            age,
            "The exchange's time is ahead of your computer's clock. Check your clock; the age of this price can't be trusted.",
        )
    if refresh_failed:
        return FreshnessInfo(Freshness.STALE, age, f"Couldn't refresh. This is the last price we got, from {ago} ago.")
    if age > stale_after:
        return FreshnessInfo(
            Freshness.STALE, age, f"Last trade was {ago} ago. The price now may be different."
        )
    if delay_seconds > 0:
        return FreshnessInfo(
            Freshness.DELAYED, age, f"Delayed {human_duration(delay_seconds)} by the source. Last trade {ago} ago."
        )
    return FreshnessInfo(Freshness.LIVE, age, f"Last trade {ago} ago.")


def classify_series(
    last_candle_start: int | None,
    interval_seconds: int,
    now: datetime,
    *,
    refresh_failed: bool = False,
) -> FreshnessInfo:
    if last_candle_start is None:
        return FreshnessInfo(Freshness.UNAVAILABLE, None, "No chart data is available.")

    last_start = datetime.fromtimestamp(last_candle_start, tz=now.tzinfo)
    age, clock_skew = _age(last_start, now)
    if clock_skew:
        return FreshnessInfo(
            Freshness.STALE, age, "The chart's newest point is in the future for your computer. Check your clock."
        )

    ago = human_duration(age)
    if refresh_failed:
        return FreshnessInfo(Freshness.STALE, age, f"Couldn't refresh the chart. Newest point is from {ago} ago.")
    # A bucket starts at most one interval ago; two intervals allows for exchange publishing lag.
    if age > 2 * interval_seconds + 120:
        return FreshnessInfo(
            Freshness.STALE, age, f"Newest point is from {ago} ago, older than expected. Trading may have paused."
        )
    if interval_seconds >= 86400:
        period = "week" if interval_seconds >= 7 * 86400 else "day"
        return FreshnessInfo(
            Freshness.END_OF_DAY,
            age,
            f"One point per {period}. Past {period}s are final; the newest point is still changing.",
        )
    return FreshnessInfo(Freshness.LIVE, age, f"Newest point started {ago} ago.")
