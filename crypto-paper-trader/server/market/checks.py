from dataclasses import dataclass, field
from datetime import datetime, timezone

from .models import Candle, Notice, Quote

CROSS_CHECK_THRESHOLD_PCT = 0.5
CROSS_CHECK_MAX_TIME_GAP_SECONDS = 120
UNUSUAL_24H_MOVE_PCT = 40.0
UNUSUAL_CANDLE_JUMP_PCT = 50.0
PEG_TOLERANCE_PCT = 2.0

STABLECOIN_PEGS = {
    "USDT": "USD",
    "USDC": "USD",
    "DAI": "USD",
    "PYUSD": "USD",
    "FDUSD": "USD",
    "USDS": "USD",
    "USDE": "USD",
    "TUSD": "USD",
    "GUSD": "USD",
    "USDP": "USD",
    "RLUSD": "USD",
    "EURC": "EUR",
}


def pct_diff(a: float, b: float) -> float:
    return abs(a - b) / abs(b) * 100.0


def sanity_check_quote(quote: Quote, expected_peg_price: float | None = None) -> list[Notice]:
    notices: list[Notice] = []
    price = quote.price

    if price is None:
        notices.append(Notice("missing_price", "danger", f"{quote.source_name} sent no price."))
        return notices
    if price <= 0:
        notices.append(
            Notice("impossible_price", "danger", f"{quote.source_name} sent an impossible price ({price}). It is hidden.")
        )
        return notices

    if quote.volume_24h is None:
        notices.append(Notice("missing_volume", "warning", "Trading volume is missing, so we can't tell how active this market is."))
    elif quote.volume_24h == 0:
        notices.append(
            Notice("zero_volume", "warning", "No trades in the last 24 hours on this market. The price may be out of date.")
        )

    if quote.open_24h and quote.open_24h > 0:
        move = (price / quote.open_24h - 1) * 100
        if abs(move) >= UNUSUAL_24H_MOVE_PCT:
            notices.append(
                Notice(
                    "unusual_move",
                    "warning",
                    f"The price moved {move:+.1f}% in 24 hours. That is unusual even for crypto. "
                    "Check the news and the second source before relying on it.",
                )
            )

    if expected_peg_price is not None and expected_peg_price > 0:
        off = (price / expected_peg_price - 1) * 100
        if abs(off) >= PEG_TOLERANCE_PCT:
            notices.append(
                Notice(
                    "depeg",
                    "danger",
                    f"This stablecoin is {off:+.1f}% away from the value it is meant to hold. "
                    "That is called a depeg and can mean trouble.",
                )
            )
    return notices


@dataclass
class Comparison:
    source: str
    source_name: str
    price: float | None
    diff_pct: float | None
    comparable: bool
    note: str

    def as_dict(self) -> dict:
        return {
            "source": self.source,
            "source_name": self.source_name,
            "price": self.price,
            "diff_pct": None if self.diff_pct is None else round(self.diff_pct, 3),
            "comparable": self.comparable,
            "note": self.note,
        }


@dataclass
class CrossCheck:
    status: str
    threshold_pct: float
    comparisons: list[Comparison] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "status": self.status,
            "threshold_pct": self.threshold_pct,
            "comparisons": [c.as_dict() for c in self.comparisons],
        }


def cross_check(primary: Quote, others: list[Quote], threshold_pct: float = CROSS_CHECK_THRESHOLD_PCT) -> CrossCheck:
    comparisons: list[Comparison] = []
    if primary.price is None or primary.price <= 0:
        return CrossCheck("unchecked", threshold_pct)

    for other in others:
        if other.price is None or other.price <= 0:
            comparisons.append(Comparison(other.source, other.source_name, None, None, False, "No usable price."))
            continue
        if primary.observed_at and other.observed_at:
            gap = abs((primary.observed_at - other.observed_at).total_seconds())
            if gap > CROSS_CHECK_MAX_TIME_GAP_SECONDS:
                comparisons.append(
                    Comparison(
                        other.source,
                        other.source_name,
                        other.price,
                        None,
                        False,
                        "Its last trade is too far apart in time to compare fairly.",
                    )
                )
                continue
        diff = pct_diff(other.price, primary.price)
        note = "Matches." if diff <= threshold_pct else f"Differs by more than {threshold_pct}%."
        comparisons.append(Comparison(other.source, other.source_name, other.price, diff, True, note))

    compared = [c for c in comparisons if c.comparable]
    if not compared:
        status = "unchecked"
    elif any(c.diff_pct is not None and c.diff_pct > threshold_pct for c in compared):
        status = "disagree"
    else:
        status = "agree"
    return CrossCheck(status, threshold_pct, comparisons)


def _is_valid(c: Candle) -> bool:
    if min(c.open, c.high, c.low, c.close) <= 0:
        return False
    if c.high < c.low:
        return False
    tol = c.high * 1e-9
    return c.low - tol <= c.open <= c.high + tol and c.low - tol <= c.close <= c.high + tol


def sanity_check_candles(candles: list[Candle]) -> tuple[list[Candle], list[Notice]]:
    notices: list[Notice] = []
    clean = [c for c in candles if _is_valid(c)]
    dropped = len(candles) - len(clean)
    if dropped:
        notices.append(
            Notice(
                "invalid_candles",
                "warning",
                f"{dropped} chart point{'s' if dropped != 1 else ''} had impossible values and "
                f"{'were' if dropped != 1 else 'was'} left out.",
            )
        )

    missing_volume = sum(1 for c in clean if c.volume is None)
    if missing_volume:
        notices.append(Notice("missing_volume", "info", f"{missing_volume} chart points have no volume."))

    for prev, cur in zip(clean, clean[1:]):
        if pct_diff(cur.close, prev.close) >= UNUSUAL_CANDLE_JUMP_PCT:
            when = datetime.fromtimestamp(cur.time, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            notices.append(
                Notice(
                    "unusual_jump",
                    "warning",
                    f"The price jumped {pct_diff(cur.close, prev.close):.0f}% in one step at {when}. "
                    "Check the news for that date before trusting it.",
                )
            )
            break
    return clean, notices
