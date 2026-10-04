"""The interface every marketplace connector implements.

A connector declares what it can do for each operation. Anything not permitted
by the platform is ASSISTED (a manual step by the owner) or UNSUPPORTED — it is
never faked.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime

AUTOMATED, ASSISTED, UNSUPPORTED, PENDING = "AUTOMATED", "ASSISTED", "UNSUPPORTED", "PENDING REVIEW"
OPERATIONS = ("search", "fetch", "publish", "update", "mark_sold")
STATES = ("ONLINE", "DEGRADED", "AUTH_REQUIRED", "RATE_LIMITED", "BLOCKED", "ERROR", "DISABLED")


@dataclass
class RawListing:
    marketplace: str
    title: str
    price: float
    description: str = ""
    external_id: str | None = None
    url: str | None = None
    location: str | None = None
    travel_minutes: float | None = None
    distance_km: float | None = None
    location_confidence: str = "LOW"
    delivery: str = "pickup"
    seller_id: str | None = None
    seller_rating: float | None = None
    seller_account_age_days: int | None = None
    image_urls: list[str] = field(default_factory=list)
    image_hashes: list[str] = field(default_factory=list)
    listed_at: datetime | None = None
    structured: dict = field(default_factory=dict)  # marketplace-provided fields (VERIFIED)
    is_paper: bool = False
    source: str = "scan"


@dataclass
class Capabilities:
    discovery: str
    publishing: str
    operations: dict[str, str]
    reason: str
    source: str = ""  # where the decision comes from (ToS URL etc.)

    def label(self, name: str) -> str:
        return f"{name} — Discovery: {self.discovery} · Publishing: {self.publishing} · Reason: {self.reason}"


class MarketplaceConnector(ABC):
    name: str = "base"
    display_name: str = "Base"
    sells_shipped_only: bool = False

    @abstractmethod
    def capabilities(self) -> Capabilities: ...

    def search(self, query: str) -> list[RawListing]:
        raise NotImplementedError(f"{self.display_name}: search is {self.capabilities().operations['search']}")

    def fetch_listing(self, url: str) -> RawListing:
        raise NotImplementedError(f"{self.display_name}: fetch is {self.capabilities().operations['fetch']}")

    def normalize_listing(self, raw: RawListing) -> RawListing:
        return raw

    def create_listing_draft(self, item: dict) -> dict:
        """Always available: produces copy-ready text the owner can paste."""
        return {"marketplace": self.name, "mode": "DRAFT", **item}

    def publish_listing(self, draft: dict) -> dict:
        raise NotImplementedError(f"{self.display_name}: publishing is {self.capabilities().publishing}")

    def update_listing(self, listing_ref: str, changes: dict) -> dict:
        raise NotImplementedError(f"{self.display_name}: update is {self.capabilities().operations['update']}")

    def mark_sold(self, listing_ref: str) -> dict:
        raise NotImplementedError(f"{self.display_name}: mark sold is {self.capabilities().operations['mark_sold']}")

    def health_check(self) -> tuple[str, str]:
        return "DISABLED", "Not enabled"
