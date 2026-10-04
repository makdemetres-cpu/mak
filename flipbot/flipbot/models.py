"""Database entities. Schema changes go through Alembic (migrations/)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


class Listing(Base):
    """One observed marketplace listing plus its latest evaluation."""
    __tablename__ = "listing"

    id: Mapped[int] = mapped_column(primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(32), index=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    url: Mapped[Optional[str]] = mapped_column(String(1024))
    title: Mapped[str] = mapped_column(String(512))
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    negotiable: Mapped[bool] = mapped_column(Boolean, default=False)
    delivery: Mapped[str] = mapped_column(String(16), default="pickup")  # pickup | shipped

    model: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    storage_gb: Mapped[Optional[int]] = mapped_column(Integer)
    color: Mapped[Optional[str]] = mapped_column(String(32))
    battery_health: Mapped[Optional[int]] = mapped_column(Integer)
    battery_cycles: Mapped[Optional[int]] = mapped_column(Integer)
    condition: Mapped[Optional[str]] = mapped_column(String(32))
    sim_type: Mapped[Optional[str]] = mapped_column(String(32))

    location: Mapped[Optional[str]] = mapped_column(String(128))
    lat: Mapped[Optional[float]] = mapped_column(Float)
    lon: Mapped[Optional[float]] = mapped_column(Float)
    travel_minutes: Mapped[Optional[float]] = mapped_column(Float)
    distance_km: Mapped[Optional[float]] = mapped_column(Float)
    location_confidence: Mapped[str] = mapped_column(String(8), default="LOW")

    seller_id: Mapped[Optional[str]] = mapped_column(String(128))
    seller_rating: Mapped[Optional[float]] = mapped_column(Float)
    seller_account_age_days: Mapped[Optional[int]] = mapped_column(Integer)
    image_urls: Mapped[list] = mapped_column(JSON, default=list)
    image_hashes: Mapped[list] = mapped_column(JSON, default=list)
    raw_data_reference: Mapped[Optional[str]] = mapped_column(String(256))
    content_hash: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    candidate_key: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    duplicate_of_id: Mapped[Optional[int]] = mapped_column(ForeignKey("listing.id"))

    listed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE")  # ACTIVE | DISAPPEARED | SOLD
    is_paper: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(16), default="scan")  # scan | intake | paper

    # Evaluation (refreshed by the pipeline)
    tier: Mapped[Optional[str]] = mapped_column(String(16), index=True)  # HOT GOOD NEGOTIATE WATCH REJECTED
    deal_score: Mapped[Optional[float]] = mapped_column(Float)
    risk_level: Mapped[Optional[str]] = mapped_column(String(8))
    my_max_buy: Mapped[Optional[float]] = mapped_column(Float)
    expected_sale: Mapped[Optional[float]] = mapped_column(Float)
    net_profit: Mapped[Optional[float]] = mapped_column(Float)
    roi_percent: Mapped[Optional[float]] = mapped_column(Float)
    evaluation: Mapped[dict] = mapped_column(JSON, default=dict)
    alerted_price: Mapped[Optional[float]] = mapped_column(Float)
    decision: Mapped[Optional[str]] = mapped_column(String(16))  # APPROVED | REJECTED

    snapshots: Mapped[list["ListingSnapshot"]] = relationship(back_populates="listing",
                                                             cascade="all, delete-orphan")


class ListingSnapshot(Base):
    """Price/status history. Never deleted when a listing disappears."""
    __tablename__ = "listing_snapshot"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listing.id"), index=True)
    seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    price: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(16))
    listing: Mapped[Listing] = relationship(back_populates="snapshots")


class ListingSource(Base):
    """Cross-platform links: one candidate, several marketplace sightings."""
    __tablename__ = "listing_source"

    id: Mapped[int] = mapped_column(primary_key=True)
    primary_listing_id: Mapped[int] = mapped_column(ForeignKey("listing.id"), index=True)
    linked_listing_id: Mapped[int] = mapped_column(ForeignKey("listing.id"))
    reason: Mapped[str] = mapped_column(String(64))  # same_url | vendora_mirror | image_hash


class PriceRuleVersion(Base):
    __tablename__ = "price_rule_version"

    id: Mapped[int] = mapped_column(primary_key=True)
    imported_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    source_name: Mapped[str] = mapped_column(String(256))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_sample: Mapped[bool] = mapped_column(Boolean, default=False)
    report: Mapped[dict] = mapped_column(JSON, default=dict)
    rules: Mapped[list["PriceRule"]] = relationship(back_populates="version",
                                                    cascade="all, delete-orphan")


class PriceRule(Base):
    """MY MAX BUY PRICE for a model/storage. Never hard-coded, always imported."""
    __tablename__ = "price_rule"

    id: Mapped[int] = mapped_column(primary_key=True)
    version_id: Mapped[int] = mapped_column(ForeignKey("price_rule_version.id"), index=True)
    model: Mapped[str] = mapped_column(String(64), index=True)
    storage_gb: Mapped[int] = mapped_column(Integer)
    max_buy_price: Mapped[float] = mapped_column(Float)
    min_battery_health: Mapped[Optional[int]] = mapped_column(Integer)
    condition_rules: Mapped[Optional[str]] = mapped_column(String(256))
    notes: Mapped[Optional[str]] = mapped_column(String(512))
    version: Mapped[PriceRuleVersion] = relationship(back_populates="rules")


class MarketComparable(Base):
    """A resale price data point used by the valuation engine."""
    __tablename__ = "market_comparable"

    id: Mapped[int] = mapped_column(primary_key=True)
    model: Mapped[str] = mapped_column(String(64), index=True)
    storage_gb: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Float)
    condition_band: Mapped[str] = mapped_column(String(16), default="good")
    battery_band: Mapped[str] = mapped_column(String(8), default="85+")
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    kind: Mapped[str] = mapped_column(String(16))  # ASKING | DISAPPEARED | MY_SALE
    marketplace: Mapped[Optional[str]] = mapped_column(String(32))
    is_paper: Mapped[bool] = mapped_column(Boolean, default=False)


class InventoryItem(Base):
    __tablename__ = "inventory_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True)  # INV-00042
    listing_id: Mapped[Optional[int]] = mapped_column(ForeignKey("listing.id"))
    model: Mapped[str] = mapped_column(String(64))
    storage_gb: Mapped[int] = mapped_column(Integer)
    color: Mapped[Optional[str]] = mapped_column(String(32))
    battery_health: Mapped[Optional[int]] = mapped_column(Integer)
    condition: Mapped[Optional[str]] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(16), index=True)
    purchase_path: Mapped[str] = mapped_column(String(16), default="in_person")  # in_person | shipped
    purchase_cost: Mapped[Optional[float]] = mapped_column(Float)
    repair_cost: Mapped[float] = mapped_column(Float, default=0)
    predicted_sale: Mapped[Optional[float]] = mapped_column(Float)
    predicted_profit: Mapped[Optional[float]] = mapped_column(Float)
    predicted_score: Mapped[Optional[float]] = mapped_column(Float)
    listing_price: Mapped[Optional[float]] = mapped_column(Float)
    sale_price: Mapped[Optional[float]] = mapped_column(Float)
    sale_platform: Mapped[Optional[str]] = mapped_column(String(32))
    fees_paid: Mapped[float] = mapped_column(Float, default=0)
    net_profit: Mapped[Optional[float]] = mapped_column(Float)
    purchased_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    listed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    sold_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    return_window_ends_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    platforms: Mapped[dict] = mapped_column(JSON, default=dict)  # {"vendora": "ACTIVE", ...}
    is_paper: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Inspection(Base):
    __tablename__ = "inspection"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[Optional[int]] = mapped_column(ForeignKey("listing.id"))
    inventory_id: Mapped[Optional[int]] = mapped_column(ForeignKey("inventory_item.id"))
    path: Mapped[str] = mapped_column(String(16))  # in_person | on_arrival
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    decision: Mapped[Optional[str]] = mapped_column(String(16))  # BUY | WALK_AWAY | RETURN | KEEP
    items: Mapped[list["InspectionItem"]] = relationship(cascade="all, delete-orphan")


class InspectionItem(Base):
    __tablename__ = "inspection_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    inspection_id: Mapped[int] = mapped_column(ForeignKey("inspection.id"), index=True)
    section: Mapped[str] = mapped_column(String(48))
    label: Mapped[str] = mapped_column(String(256))
    result: Mapped[str] = mapped_column(String(8), default="UNKNOWN")  # PASS FAIL UNKNOWN
    note: Mapped[Optional[str]] = mapped_column(Text)


class SystemEvent(Base):
    """Audit trail: every human decision and every state change."""
    __tablename__ = "system_event"

    id: Mapped[int] = mapped_column(primary_key=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    kind: Mapped[str] = mapped_column(String(32))
    message: Mapped[str] = mapped_column(String(512))
    data: Mapped[dict] = mapped_column(JSON, default=dict)


class ConnectorStatus(Base):
    __tablename__ = "connector_status"

    name: Mapped[str] = mapped_column(String(32), primary_key=True)
    state: Mapped[str] = mapped_column(String(16))  # ONLINE DEGRADED AUTH_REQUIRED RATE_LIMITED BLOCKED ERROR DISABLED
    detail: Mapped[str] = mapped_column(String(512), default="")
    last_ok_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    failures: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class LocalityTravel(Base):
    """Cached drive time from base to a locality. Refreshed rarely."""
    __tablename__ = "locality_travel"

    locality: Mapped[str] = mapped_column(String(128), primary_key=True)
    minutes: Mapped[float] = mapped_column(Float)
    km: Mapped[Optional[float]] = mapped_column(Float)
    provider: Mapped[str] = mapped_column(String(32))
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class AIUsage(Base):
    __tablename__ = "ai_usage"

    id: Mapped[int] = mapped_column(primary_key=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    model: Mapped[str] = mapped_column(String(64))
    purpose: Mapped[str] = mapped_column(String(32))
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0)


class TelegramNotification(Base):
    __tablename__ = "telegram_notification"

    id: Mapped[int] = mapped_column(primary_key=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    kind: Mapped[str] = mapped_column(String(24))
    listing_id: Mapped[Optional[int]] = mapped_column(ForeignKey("listing.id"))
    text: Mapped[str] = mapped_column(Text)
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    queued_for_quiet_hours: Mapped[bool] = mapped_column(Boolean, default=False)


class Heartbeat(Base):
    """Single row updated every minute; a gap on restart = downtime to report."""
    __tablename__ = "heartbeat"

    id: Mapped[int] = mapped_column(primary_key=True)
    last_beat_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    paused: Mapped[bool] = mapped_column(Boolean, default=False)
