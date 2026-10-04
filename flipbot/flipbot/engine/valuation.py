"""Market resale valuation. Never the highest listing — a weighted, robust estimate."""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import MarketComparable, utcnow

CONDITION_FACTOR = {"like_new": 1.05, "excellent": 1.03, "very_good": 1.0, "good": 0.96,
                    "fair": 0.9, "damaged": 0.7, None: 0.97}
KIND_WEIGHT = {"MY_SALE": 3.0, "DISAPPEARED": 1.3, "ASKING": 1.0}
ASKING_DISCOUNT = 0.97  # asking prices overstate what things actually sell for
HALF_LIFE_DAYS = 30


def battery_band(health: int | None) -> str:
    if health is None:
        return "unknown"
    return "85+" if health >= 85 else "80-84" if health >= 80 else "<80"


BATTERY_FACTOR = {"85+": 1.0, "80-84": 0.97, "<80": 0.92, "unknown": 0.97}


@dataclass
class Valuation:
    low: float
    typical: float
    high: float
    recommended_listing: float
    expected_sale: float
    n: int
    confidence: str  # HIGH MEDIUM LOW NONE
    liquidity: float  # 0..1, how fast this model/storage resells

    def as_dict(self) -> dict:
        return {k: (round(v, 2) if isinstance(v, float) else v) for k, v in self.__dict__.items()}


def _weighted_quantile(values: list[float], weights: list[float], q: float) -> float:
    pairs = sorted(zip(values, weights))
    total, acc = sum(weights), 0.0
    for value, weight in pairs:
        acc += weight
        if acc >= q * total:
            return value
    return pairs[-1][0]


def _round_listing(price: float) -> float:
    """€341 → €349 style price points."""
    return math.floor(price / 10) * 10 + 9


def value(session: Session, model: str, storage_gb: int, condition: str | None,
          battery_health: int | None, now: datetime | None = None,
          include_paper: bool = True) -> Valuation | None:
    now = now or utcnow()
    query = select(MarketComparable).where(MarketComparable.model == model,
                                           MarketComparable.storage_gb == storage_gb)
    if not include_paper:
        query = query.where(MarketComparable.is_paper.is_(False))
    comps = list(session.scalars(query))
    if not comps:
        return None

    target = CONDITION_FACTOR.get(condition, 0.97) * BATTERY_FACTOR[battery_band(battery_health)]
    values, weights = [], []
    for c in comps:
        age = max(0.0, (now - c.observed_at).total_seconds() / 86400)
        recency = 0.5 ** (age / HALF_LIFE_DAYS)
        price = c.price * (ASKING_DISCOUNT if c.kind == "ASKING" else 1.0)
        # normalise every comp to the target's condition + battery band
        comp_factor = CONDITION_FACTOR.get(c.condition_band, 0.97) * BATTERY_FACTOR.get(c.battery_band, 0.97)
        values.append(price * target / comp_factor)
        weights.append(recency * KIND_WEIGHT.get(c.kind, 1.0))

    low = _weighted_quantile(values, weights, 0.25)
    typical = _weighted_quantile(values, weights, 0.5)
    high = _weighted_quantile(values, weights, 0.75)
    expected = (low + 2 * typical) / 3  # conservative: pulled toward the low side
    n = len(comps)
    confidence = "HIGH" if n >= 10 else "MEDIUM" if n >= 4 else "LOW"
    recent_exits = sum(1 for c in comps if c.kind in ("MY_SALE", "DISAPPEARED")
                       and (now - c.observed_at).days <= 60)
    liquidity = min(1.0, 0.35 + recent_exits / 10)
    return Valuation(low=low, typical=typical, high=high,
                     recommended_listing=_round_listing(typical + (high - typical) / 2),
                     expected_sale=expected, n=n, confidence=confidence, liquidity=liquidity)
