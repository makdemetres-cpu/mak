"""Configuration: one YAML file, validated on load.

Every value the brief marks `___` (money, thresholds, fees) is Optional and ships
empty. Nothing financial is invented: in PAPER mode an unset value falls back to a
clearly labelled placeholder from PAPER_PLACEHOLDERS so the simulation can run, and
LIVE mode refuses to start until every required value is set by the owner
(see `live_blockers`).
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Optional

import yaml
from pydantic import BaseModel, Field, field_validator, model_validator

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = ROOT / "config.yaml"
EXAMPLE_CONFIG_PATH = ROOT / "config.example.yaml"


class ExceptionalOverride(BaseModel):
    enabled: bool = True
    min_expected_profit_eur: Optional[float] = None


class LocationCfg(BaseModel):
    base_location: str = "Artemida, Attica, Greece"
    geocode_on_startup: bool = True
    excellent_minutes: int = 15
    very_good_minutes: int = 30
    preferred_max_minutes: int = 40
    hard_max_minutes: int = 60
    exceptional_deal_override: ExceptionalOverride = ExceptionalOverride()

    @model_validator(mode="after")
    def _ordered(self) -> "LocationCfg":
        tiers = [self.excellent_minutes, self.very_good_minutes,
                 self.preferred_max_minutes, self.hard_max_minutes]
        if tiers != sorted(tiers) or tiers[0] <= 0:
            raise ValueError("location tiers must be positive and ascending: "
                             "excellent < very_good < preferred_max < hard_max")
        return self


class DealRules(BaseModel):
    minimum_profit_eur: Optional[float] = None
    minimum_roi_percent: Optional[float] = None
    hot_min_score: Optional[int] = None
    good_min_score: Optional[int] = None
    price_drop_realert_eur: Optional[float] = None


class ProfitRules(BaseModel):
    repair_reserve_eur: Optional[float] = None
    travel_cost_per_km: Optional[float] = None
    time_value_eur_per_hour: Optional[float] = None
    negotiation_band_eur: Optional[float] = None
    negotiation_buffer_percent: Optional[float] = None
    average_speed_kmh: float = 45.0  # converts drive minutes to km when routing gives no distance


class PlatformFees(BaseModel):
    sell_fee_pct: Optional[float] = None
    withdrawal_fee: Optional[float] = None
    shipping_eur: Optional[float] = None


class RiskCfg(BaseModel):
    minimum_battery_health: Optional[int] = None
    allow_unknown_battery_health: Optional[bool] = None
    allow_repaired_devices: Optional[bool] = None
    allow_esim_only_us_models: Optional[bool] = None
    allow_face_id_broken: bool = False
    parts_mode: bool = False


class ScoringWeights(BaseModel):
    price_opportunity: float = 30
    expected_profit: float = 25
    condition: float = 15
    listing_quality: float = 10
    location: float = 10
    liquidity: float = 10

    @model_validator(mode="after")
    def _sum(self) -> "ScoringWeights":
        total = sum(self.model_dump().values())
        if abs(total - 100) > 0.01:
            raise ValueError(f"deal_score_weights must sum to 100 (got {total})")
        return self


class AICfg(BaseModel):
    monthly_budget_usd: Optional[float] = 10.0
    parsing_model: str = "claude-haiku-4-5-20251001"
    writing_model: str = "claude-sonnet-5-5"


class RoutingCfg(BaseModel):
    provider: Literal["openrouteservice", "none"] = "openrouteservice"
    cache_days: int = 90  # locality drive times are refreshed this rarely


class NotificationCfg(BaseModel):
    quiet_hours: str = "23:00-08:00"
    hot_bypasses_quiet_hours: bool = True
    heartbeat_time: str = "09:00"

    @field_validator("quiet_hours")
    @classmethod
    def _hours(cls, v: str) -> str:
        try:
            start, end = v.split("-")
            for part in (start, end):
                h, m = part.split(":")
                assert 0 <= int(h) < 24 and 0 <= int(m) < 60
        except Exception as exc:  # noqa: BLE001 - re-raised as a validation error
            raise ValueError("quiet_hours must look like 23:00-08:00") from exc
        return v


class ScanningCfg(BaseModel):
    scan_interval_minutes: Optional[int] = None
    max_requests_per_hour: Optional[int] = None


class OwnerCfg(BaseModel):
    display_name: str = "Owner"


class Config(BaseModel):
    mode: Literal["PAPER", "LIVE"] = "PAPER"
    owner: OwnerCfg = OwnerCfg()
    location: LocationCfg = LocationCfg()
    deal_rules: DealRules = DealRules()
    profit_rules: ProfitRules = ProfitRules()
    risk: RiskCfg = RiskCfg()
    deal_score_weights: ScoringWeights = ScoringWeights()
    fees: dict[str, PlatformFees] = Field(default_factory=lambda: {
        "vendora": PlatformFees(), "skoop": PlatformFees(),
        "vinted": PlatformFees(), "facebook": PlatformFees(sell_fee_pct=0),
    })
    scanning: ScanningCfg = ScanningCfg()
    ai: AICfg = AICfg()
    notifications: NotificationCfg = NotificationCfg()
    routing: RoutingCfg = RoutingCfg()
    target_models: list[str] = Field(default_factory=lambda: [
        "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
        "iPhone 12", "iPhone 12 mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
        "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
        "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
        "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
    ])
    database_path: str = "data/flipbot.db"


# ---------------------------------------------------------------------------
# PAPER placeholders. These exist ONLY so the simulation can run end to end.
# They are not recommendations and never apply in LIVE mode.
# ---------------------------------------------------------------------------
PAPER_PLACEHOLDERS: dict[str, float | int | bool] = {
    "deal_rules.minimum_profit_eur": 30,
    "deal_rules.minimum_roi_percent": 10,
    "deal_rules.hot_min_score": 80,
    "deal_rules.good_min_score": 65,
    "deal_rules.price_drop_realert_eur": 10,
    "profit_rules.repair_reserve_eur": 15,
    "profit_rules.travel_cost_per_km": 0.25,
    "profit_rules.time_value_eur_per_hour": 0,
    "profit_rules.negotiation_band_eur": 25,
    "profit_rules.negotiation_buffer_percent": 7,
    "location.exceptional_deal_override.min_expected_profit_eur": 90,
    "risk.minimum_battery_health": 80,
    "risk.allow_unknown_battery_health": True,
    "risk.allow_repaired_devices": True,
    "risk.allow_esim_only_us_models": True,
    "fees.*.sell_fee_pct": 0,
    "fees.*.withdrawal_fee": 0,
    "fees.*.shipping_eur": 0,
    "ai.monthly_budget_usd": 0,
    "scanning.scan_interval_minutes": 10,
    "scanning.max_requests_per_hour": 20,
}

# Values that must be set by the owner before LIVE mode is allowed.
LIVE_REQUIRED = [
    "deal_rules.minimum_profit_eur", "deal_rules.minimum_roi_percent",
    "deal_rules.hot_min_score", "deal_rules.good_min_score",
    "profit_rules.repair_reserve_eur", "profit_rules.travel_cost_per_km",
    "profit_rules.negotiation_band_eur", "profit_rules.negotiation_buffer_percent",
    "risk.minimum_battery_health", "risk.allow_unknown_battery_health",
    "risk.allow_repaired_devices", "risk.allow_esim_only_us_models",
    "ai.monthly_budget_usd",
]


def _get(cfg: Config, dotted: str):
    node = cfg
    for part in dotted.split("."):
        node = node.get(part) if isinstance(node, dict) else getattr(node, part)
    return node


def setting(cfg: Config, dotted: str):
    """Return a setting, substituting the PAPER placeholder only in PAPER mode."""
    value = _get(cfg, dotted)
    if value is None and cfg.mode == "PAPER":
        if dotted in PAPER_PLACEHOLDERS:
            return PAPER_PLACEHOLDERS[dotted]
        if dotted.startswith("fees."):
            return PAPER_PLACEHOLDERS["fees.*." + dotted.rsplit(".", 1)[-1]]
    return value


def fee(cfg: Config, platform: str, field: str) -> float:
    fees = cfg.fees.get(platform)
    value = getattr(fees, field) if fees else None
    if value is None:
        value = PAPER_PLACEHOLDERS["fees.*." + field] if cfg.mode == "PAPER" else None
    if value is None:
        raise ValueError(f"fee {platform}.{field} is not configured")
    return float(value)


def live_blockers(cfg: Config, has_price_rules: bool) -> list[str]:
    """Everything that must be filled in before LIVE mode may start."""
    missing = [k for k in LIVE_REQUIRED if _get(cfg, k) is None]
    for platform, fees in cfg.fees.items():
        if fees.sell_fee_pct is None:
            missing.append(f"fees.{platform}.sell_fee_pct")
    if cfg.location.exceptional_deal_override.enabled and \
            cfg.location.exceptional_deal_override.min_expected_profit_eur is None:
        missing.append("location.exceptional_deal_override.min_expected_profit_eur")
    if not has_price_rules:
        missing.append("buying-price spreadsheet (import it on the Settings page)")
    return missing


@dataclass
class Secrets:
    """Read from the environment / .env only. Never logged, never sent anywhere."""
    telegram_bot_token: str | None
    telegram_allowed_user_ids: frozenset[int]
    anthropic_api_key: str | None
    routing_api_key: str | None

    @classmethod
    def from_env(cls) -> "Secrets":
        _load_dotenv(ROOT / ".env")
        ids = os.environ.get("TELEGRAM_ALLOWED_USER_IDS", "")
        return cls(
            telegram_bot_token=os.environ.get("TELEGRAM_BOT_TOKEN") or None,
            telegram_allowed_user_ids=frozenset(
                int(x) for x in ids.replace(" ", "").split(",") if x.strip().isdigit()),
            anthropic_api_key=os.environ.get("ANTHROPIC_API_KEY") or None,
            routing_api_key=os.environ.get("OPENROUTESERVICE_API_KEY") or None,
        )


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        value = value.strip()
        if value[:1] in ('"', "'"):
            value = value[1:].split(value[0], 1)[0]
        else:
            value = value.split(" #", 1)[0].strip()  # allow "KEY=value   # comment"
        os.environ.setdefault(key.strip(), value)


def load_config(path: Path | None = None) -> Config:
    path = path or (DEFAULT_CONFIG_PATH if DEFAULT_CONFIG_PATH.exists() else EXAMPLE_CONFIG_PATH)
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return Config.model_validate(raw)
