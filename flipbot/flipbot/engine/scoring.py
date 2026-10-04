"""Transparent 0–100 Deal Score: every point is explained."""

from __future__ import annotations

from dataclasses import dataclass, field

from ..config import ScoringWeights
from .parsing import ParsedListing

CONDITION_PENALTY = {"like_new": 0.0, "excellent": 0.0, "very_good": 0.05, "good": 0.12,
                     "fair": 0.25, "damaged": 0.5, None: 0.1}


@dataclass
class Component:
    key: str
    label: str
    weight: float
    fraction: float  # 0..1
    reason: str

    @property
    def points(self) -> float:
        return round(self.weight * max(0.0, min(1.0, self.fraction)), 1)

    def as_dict(self) -> dict:
        return {"key": self.key, "label": self.label, "weight": self.weight,
                "points": self.points, "reason": self.reason}


@dataclass
class ScoreCard:
    components: list[Component] = field(default_factory=list)

    @property
    def total(self) -> float:
        return round(sum(c.points for c in self.components), 1)


def price_opportunity(price: float, max_buy: float, negotiable: bool, band: float) -> tuple[float, str]:
    if price <= max_buy:
        gap = (max_buy - price) / max_buy
        return 0.5 + min(0.5, gap / 0.10 * 0.5), f"€{max_buy - price:.0f} below my max (€{max_buy:.0f})"
    over = price - max_buy
    base = max(0.0, 0.4 * (1 - over / band)) if band > 0 else 0.0
    if negotiable:
        base = min(0.5, base + 0.1)
    return base, f"€{over:.0f} above my max (€{max_buy:.0f})" + (" · negotiable" if negotiable else "")


def condition_fraction(p: ParsedListing, min_battery: int) -> tuple[float, list[str]]:
    frac, notes = 1.0, []
    bh = p.battery_health.value
    if bh is None:
        frac -= 0.15
        notes.append("battery unknown")
    elif bh < min_battery:
        frac -= 0.4
        notes.append(f"battery {bh}% below my minimum {min_battery}%")
    elif bh < 85:
        frac -= 0.2
        notes.append(f"battery {bh}%")
    elif bh < 90:
        frac -= 0.08
        notes.append(f"battery {bh}%")
    else:
        notes.append(f"battery {bh}%")
    frac -= CONDITION_PENALTY.get(p.condition.value, 0.1)
    notes.append(f"condition {(p.condition.value or 'unknown').replace('_', ' ')}")
    if p.repairs.value:
        frac -= 0.2
        notes.append("repairs: " + ", ".join(p.repairs.value))
    if p.face_id.value is None:
        frac -= 0.05
    if p.sim_type.value == "esim_only_us":
        frac -= 0.1
        notes.append("US eSIM-only")
    return max(0.0, frac), notes


def listing_quality(p: ParsedListing, photos: int, description: str) -> tuple[float, str]:
    checks = {
        "model": p.model is not None, "storage": p.storage_gb is not None,
        "battery": p.battery_health.value is not None, "condition": p.condition.value is not None,
        "3+ photos": photos >= 3, "real description": len(description) >= 80,
        "colour": p.color is not None,
    }
    missing = [k for k, ok in checks.items() if not ok]
    frac = sum(checks.values()) / len(checks)
    return frac, "complete" if not missing else "missing " + ", ".join(missing)


def build(weights: ScoringWeights, *, price_frac: float, price_reason: str,
          profit: float, min_profit: float, cond_frac: float, cond_notes: list[str],
          quality_frac: float, quality_reason: str, loc_frac: float, loc_reason: str,
          liquidity: float) -> ScoreCard:
    target = max(1.0, 2 * min_profit)
    return ScoreCard([
        Component("price_opportunity", "Price opportunity", weights.price_opportunity, price_frac, price_reason),
        Component("expected_profit", "Expected profit", weights.expected_profit,
                  max(0.0, profit) / target, f"€{profit:.0f} net (full marks at €{target:.0f})"),
        Component("condition", "Device condition", weights.condition, cond_frac, " · ".join(cond_notes)),
        Component("listing_quality", "Listing quality", weights.listing_quality, quality_frac, quality_reason),
        Component("location", "Location", weights.location, loc_frac, loc_reason),
        Component("liquidity", "Liquidity / demand", weights.liquidity, liquidity,
                  "fast mover" if liquidity >= 0.7 else "average demand" if liquidity >= 0.5 else "slow mover"),
    ])
