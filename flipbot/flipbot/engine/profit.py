"""Net profit: expected sale minus every cost, never the optimistic asking price."""

from __future__ import annotations

from dataclasses import dataclass

from ..config import Config, fee, setting

DEFAULT_SELL_PLATFORM = "vendora"


@dataclass
class ProfitBreakdown:
    expected_sale: float
    purchase_price: float
    repair_reserve: float
    platform_fee: float
    withdrawal_fee: float
    shipping: float
    travel_cost: float
    time_cost: float
    net_profit: float
    roi_percent: float

    def as_dict(self) -> dict:
        return {k: round(v, 2) for k, v in self.__dict__.items()}


def estimate(cfg: Config, expected_sale: float, purchase_price: float,
             travel_minutes: float | None, distance_km: float | None = None,
             extra_repair: float = 0.0, sell_platform: str = DEFAULT_SELL_PLATFORM,
             delivery: str = "pickup") -> ProfitBreakdown:
    repair = float(setting(cfg, "profit_rules.repair_reserve_eur") or 0) + extra_repair
    platform_fee = expected_sale * fee(cfg, sell_platform, "sell_fee_pct") / 100
    withdrawal = fee(cfg, sell_platform, "withdrawal_fee")
    shipping = fee(cfg, sell_platform, "shipping_eur")

    travel = time_cost = 0.0
    if delivery == "pickup" and travel_minutes is not None:
        km = distance_km if distance_km is not None else \
            travel_minutes / 60 * cfg.profit_rules.average_speed_kmh
        travel = 2 * km * float(setting(cfg, "profit_rules.travel_cost_per_km") or 0)
        time_cost = 2 * travel_minutes / 60 * float(setting(cfg, "profit_rules.time_value_eur_per_hour") or 0)

    net = expected_sale - purchase_price - repair - platform_fee - withdrawal - shipping - travel - time_cost
    invested = purchase_price + repair + travel
    roi = net / invested * 100 if invested > 0 else 0.0
    return ProfitBreakdown(expected_sale, purchase_price, repair, platform_fee, withdrawal,
                           shipping, travel, time_cost, net, roi)
