"""Tiered location scoring — closer is always better.

The preferred maximum (40 min) is a ceiling for "acceptable", never a minimum:
a 5-minute deal gets the best location score.
"""

from __future__ import annotations

from dataclasses import dataclass

from ..config import LocationCfg

EXCELLENT, VERY_GOOD, PREFERRED, STRETCH, TOO_FAR, SHIPPED, UNKNOWN = (
    "Excellent", "Very good", "Preferred", "Only if worth the trip", "Too far", "Shipped", "Unknown")


@dataclass
class LocationVerdict:
    tier: str
    score: float          # 0..1, multiplied by the location weight
    excluded: bool        # beyond hard max and no exceptional override
    override_applied: bool = False


def score_location(minutes: float | None, cfg: LocationCfg, delivery: str = "pickup",
                   expected_profit: float | None = None,
                   override_min_profit: float | None = None) -> LocationVerdict:
    if delivery == "shipped":
        # Shipped purchases skip travel scoring; a neutral-good score stands in
        # for the configurable "shipping risk/time" factor.
        return LocationVerdict(SHIPPED, 0.7, False)
    if minutes is None:
        return LocationVerdict(UNKNOWN, 0.4, False)
    if minutes <= cfg.excellent_minutes:
        return LocationVerdict(EXCELLENT, 1.0, False)
    if minutes <= cfg.very_good_minutes:
        # linear 0.9 → 0.75 across the band
        span = cfg.very_good_minutes - cfg.excellent_minutes
        return LocationVerdict(VERY_GOOD, 0.9 - 0.15 * (minutes - cfg.excellent_minutes) / span, False)
    if minutes <= cfg.preferred_max_minutes:
        span = cfg.preferred_max_minutes - cfg.very_good_minutes
        return LocationVerdict(PREFERRED, 0.65 - 0.15 * (minutes - cfg.very_good_minutes) / span, False)
    if minutes <= cfg.hard_max_minutes:
        span = cfg.hard_max_minutes - cfg.preferred_max_minutes
        return LocationVerdict(STRETCH, 0.4 - 0.25 * (minutes - cfg.preferred_max_minutes) / span, False)
    override = cfg.exceptional_deal_override
    if (override.enabled and expected_profit is not None and override_min_profit is not None
            and expected_profit >= override_min_profit):
        return LocationVerdict(TOO_FAR, 0.05, False, override_applied=True)
    return LocationVerdict(TOO_FAR, 0.0, True)
