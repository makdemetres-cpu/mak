"""The application core shared by the dashboard, Telegram and the scheduler.

Human-in-the-loop by construction: nothing here buys, pays, accepts offers or
messages a seller. Every human decision is written to the audit trail.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta

from sqlalchemy import func, select

from .config import Config, Secrets, live_blockers, setting
from .connectors.base import RawListing
from .connectors.registry import ManualIntakeConnector, all_connectors
from .db import Database
from .engine import inspection, pipeline, pricerules
from .models import (AIUsage, ConnectorStatus, Heartbeat, InventoryItem, Listing, LocalityTravel,
                     SystemEvent, utcnow)

log = logging.getLogger("flipbot")
audit = logging.getLogger("flipbot.audit")

INVENTORY_STATUSES = [
    "WATCHLIST", "APPROVED", "INSPECTION", "IN_TRANSIT", "PURCHASED", "REPAIR", "READY_TO_LIST",
    "LISTED", "NEGOTIATING", "SOLD", "SHIPPED", "RETURN_WINDOW", "COMPLETED", "RETURNED",
    "CANCELLED", "REJECTED",
]
# Allowed transitions. PURCHASED is only reachable from INSPECTION (in person)
# or RETURN_WINDOW (shipped, after inspect-on-arrival) — never straight from a deal.
TRANSITIONS = {
    "WATCHLIST": {"APPROVED", "REJECTED", "CANCELLED"},
    "APPROVED": {"INSPECTION", "IN_TRANSIT", "CANCELLED", "REJECTED"},
    "INSPECTION": {"PURCHASED", "CANCELLED"},
    "IN_TRANSIT": {"RETURN_WINDOW", "CANCELLED"},
    "RETURN_WINDOW": {"PURCHASED", "RETURNED"},
    "PURCHASED": {"REPAIR", "READY_TO_LIST"},
    "REPAIR": {"READY_TO_LIST"},
    "READY_TO_LIST": {"LISTED"},
    "LISTED": {"NEGOTIATING", "SOLD", "READY_TO_LIST"},
    "NEGOTIATING": {"LISTED", "SOLD"},
    "SOLD": {"SHIPPED", "COMPLETED"},
    "SHIPPED": {"COMPLETED", "RETURNED"},
    "COMPLETED": set(), "RETURNED": {"READY_TO_LIST"}, "CANCELLED": set(), "REJECTED": set(),
}
OPEN_STATUSES = {"APPROVED", "INSPECTION", "IN_TRANSIT", "RETURN_WINDOW", "PURCHASED", "REPAIR",
                 "READY_TO_LIST", "LISTED", "NEGOTIATING", "SOLD", "SHIPPED"}


class TransitionError(ValueError):
    pass


class FlipDesk:
    def __init__(self, cfg: Config, db: Database, secrets: Secrets | None = None):
        self.cfg, self.db = cfg, db
        self.secrets = secrets or Secrets(None, frozenset(), None, None)
        self.connectors = {c.name: c for c in all_connectors()}
        self.notify = None  # set by the Telegram bot: async callable(text, listing_id, kind)
        self.started_at = utcnow()
        self.telegram_state = "not configured (add the keys to .env)"

    # ------------------------------------------------------------------ audit
    def event(self, session, kind: str, message: str, **data) -> None:
        session.add(SystemEvent(kind=kind, message=message, data=data))
        audit.info("%s: %s %s", kind, message, data or "")

    # ----------------------------------------------------------------- intake
    def travel_lookup(self, locality: str) -> float | None:
        with self.db.session() as s:
            row = s.get(LocalityTravel, locality)
            return row.minutes if row else None

    def intake_text(self, text: str) -> tuple[Listing, pipeline.IngestResult]:
        connector: ManualIntakeConnector = self.connectors["manual"]  # type: ignore[assignment]
        raw = connector.from_text(text, self.travel_lookup)
        raw.is_paper = self.cfg.mode == "PAPER"
        return self.ingest(raw)

    def ingest(self, raw: RawListing) -> tuple[Listing, pipeline.IngestResult]:
        with self.db.session() as s:
            result = pipeline.ingest(s, self.cfg, raw)
            if result.should_alert:
                pipeline.mark_alerted(result.listing)
            self.event(s, "ingest", f"#{result.listing.id} {result.listing.title}",
                       tier=result.listing.tier, source=raw.source)
            s.flush()
            s.expunge(result.listing)
            return result.listing, result

    # ---------------------------------------------------------------- reading
    def deals(self, tiers: tuple[str, ...] = pipeline.ALERT_TIERS + ("WATCH",),
              delivery: str | None = None, limit: int = 100) -> list[Listing]:
        with self.db.session() as s:
            q = select(Listing).where(Listing.duplicate_of_id.is_(None), Listing.tier.in_(tiers),
                                      Listing.status == "ACTIVE", Listing.decision.is_(None))
            if delivery:
                q = q.where(Listing.delivery == delivery)
            rows = list(s.scalars(q.order_by(Listing.deal_score.desc().nulls_last()).limit(limit)))
            for r in rows:
                s.expunge(r)
            return rows

    def listing(self, listing_id: int) -> tuple[Listing, list[Listing]] | None:
        with self.db.session() as s:
            row = s.get(Listing, listing_id)
            if not row:
                return None
            mirrors = list(s.scalars(select(Listing).where(Listing.duplicate_of_id == row.id)))
            for r in [row, *mirrors]:
                s.expunge(r)
            return row, mirrors

    def all_listings(self) -> list[Listing]:
        with self.db.session() as s:
            rows = list(s.scalars(select(Listing).order_by(Listing.first_seen_at.desc())))
            for r in rows:
                s.expunge(r)
            return rows

    def inventory(self, statuses: set[str] | None = None) -> list[InventoryItem]:
        with self.db.session() as s:
            q = select(InventoryItem)
            if statuses:
                q = q.where(InventoryItem.status.in_(statuses))
            rows = list(s.scalars(q.order_by(InventoryItem.created_at.desc())))
            for r in rows:
                s.expunge(r)
            return rows

    def profit_series(self, days: int) -> list[dict]:
        since = utcnow() - timedelta(days=days)
        with self.db.session() as s:
            sold = list(s.scalars(select(InventoryItem).where(
                InventoryItem.status == "COMPLETED", InventoryItem.sold_at.is_not(None))
                .order_by(InventoryItem.sold_at)))
        running, points = 0.0, []
        for item in sold:
            running += item.net_profit or 0
            if item.sold_at >= since:
                points.append({"at": item.sold_at.isoformat(), "cumulative": round(running, 2),
                               "profit": item.net_profit, "model": f"{item.model} {item.storage_gb}GB"})
        return points

    def overview(self) -> dict:
        today = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        month = today.replace(day=1)
        with self.db.session() as s:
            count = lambda q: s.scalar(select(func.count()).select_from(Listing).where(q)) or 0  # noqa: E731
            items = list(s.scalars(select(InventoryItem)))
            ai_spend = s.scalar(select(func.coalesce(func.sum(AIUsage.cost_usd), 0))
                                .where(AIUsage.at >= month)) or 0
            has_rules = pricerules.active_version(s) is not None
            version = pricerules.active_version(s)
            sample_rules = bool(version and version.is_sample)
            hb = s.get(Heartbeat, 1)
            paused = bool(hb and hb.paused)
        open_items = [i for i in items if i.status in OPEN_STATUSES]
        done = [i for i in items if i.status == "COMPLETED"]
        realized = sum(i.net_profit or 0 for i in done)
        realized_month = sum(i.net_profit or 0 for i in done if i.sold_at and i.sold_at >= month)
        pending = sum(i.predicted_profit or 0 for i in open_items)
        inv_value = sum((i.purchase_cost or 0) + (i.repair_cost or 0) for i in open_items
                        if i.purchase_cost)
        budget = setting(self.cfg, "ai.monthly_budget_usd")
        return {
            "mode": self.cfg.mode, "owner": self.cfg.owner.display_name, "paused": paused,
            "pid": os.getpid(), "telegram": self.telegram_state,
            "uptime_seconds": int((utcnow() - self.started_at).total_seconds()),
            "candidates_today": count(Listing.first_seen_at >= today),
            "hot_deals": count((Listing.tier == "HOT") & Listing.duplicate_of_id.is_(None)
                               & Listing.decision.is_(None)),
            "inventory_value": round(inv_value, 2), "inventory_open": len(open_items),
            "realized_profit": round(realized, 2), "realized_profit_month": round(realized_month, 2),
            "pending_profit": round(pending, 2), "flips_completed": len(done),
            "ai_spend_month": round(float(ai_spend), 2), "ai_budget": budget,
            "live_blockers": live_blockers(self.cfg, has_rules and not sample_rules),
            "sample_price_rules": sample_rules,
            "base_location": self.cfg.location.base_location,
        }

    # ------------------------------------------------------------- connectors
    def connector_rows(self) -> list[dict]:
        rows = []
        with self.db.session() as s:
            for c in self.connectors.values():
                caps = c.capabilities()
                state, detail = c.health_check()
                st = s.get(ConnectorStatus, c.name)
                if st is None:
                    st = ConnectorStatus(name=c.name, state=state, detail=detail)
                    s.add(st)
                else:
                    st.state, st.detail, st.updated_at = state, detail, utcnow()
                if state == "ONLINE":
                    st.last_ok_at = utcnow()
                rows.append({"name": c.name, "display_name": c.display_name, "state": state,
                             "detail": detail, "discovery": caps.discovery,
                             "publishing": caps.publishing, "operations": caps.operations,
                             "reason": caps.reason, "label": caps.label(c.display_name),
                             "shipped_only": c.sells_shipped_only})
        return rows

    # -------------------------------------------------------- human decisions
    def decide(self, listing_id: int, decision: str) -> InventoryItem | None:
        """APPROVE creates a WATCHLIST→APPROVED inventory record. Nothing is bought."""
        if decision not in ("APPROVED", "REJECTED"):
            raise ValueError("decision must be APPROVED or REJECTED")
        with self.db.session() as s:
            row = s.get(Listing, listing_id)
            if not row:
                raise KeyError(listing_id)
            row.decision = decision
            self.event(s, "decision", f"{decision} #{row.id} {row.title}", listing_id=row.id)
            if decision == "REJECTED":
                return None
            n = (s.scalar(select(func.count()).select_from(InventoryItem)) or 0) + 1
            item = InventoryItem(
                code=f"INV-{n:05d}", listing_id=row.id, model=row.model or "Unknown",
                storage_gb=row.storage_gb or 0, color=row.color, battery_health=row.battery_health,
                condition=row.condition, status="APPROVED", is_paper=row.is_paper,
                purchase_path="shipped" if row.delivery == "shipped" else "in_person",
                predicted_sale=row.expected_sale, predicted_profit=row.net_profit,
                predicted_score=row.deal_score)
            s.add(item)
            s.flush()
            s.expunge(item)
            return item

    def transition(self, item_id: int, new_status: str, **fields) -> InventoryItem:
        with self.db.session() as s:
            item = s.get(InventoryItem, item_id)
            if not item:
                raise KeyError(item_id)
            if new_status not in TRANSITIONS.get(item.status, set()):
                raise TransitionError(f"{item.status} → {new_status} is not allowed")
            if new_status == "PURCHASED" and item.purchase_path == "in_person" and \
                    not inspection.has_decision(s, item.id, "BUY"):
                raise TransitionError("Complete the inspection checklist with BUY first")
            if new_status == "PURCHASED" and item.purchase_path == "shipped" and \
                    not inspection.has_decision(s, item.id, "KEEP"):
                raise TransitionError("Complete inspect-on-arrival with KEEP first")
            now = utcnow()
            if new_status == "RETURN_WINDOW":
                hours = 48 if fields.pop("platform", "skoop") == "skoop" else int(fields.pop("window_hours", 48))
                item.return_window_ends_at = now + timedelta(hours=hours)
            if new_status == "PURCHASED":
                item.purchased_at = now
            if new_status == "LISTED":
                item.listed_at = now
            if new_status == "SOLD":
                item.sold_at = now
            for key, value in fields.items():
                if hasattr(item, key) and value is not None:
                    setattr(item, key, value)
            if new_status == "COMPLETED" and item.sale_price is not None:
                item.net_profit = round(item.sale_price - (item.purchase_cost or 0)
                                        - (item.repair_cost or 0) - (item.fees_paid or 0), 2)
            old = item.status
            item.status = new_status
            self.event(s, "inventory", f"{item.code} {old} → {new_status}", item_id=item.id)
            s.flush()
            s.expunge(item)
            return item

    def mark_sold_cleanup(self, item: InventoryItem) -> list[str]:
        """Which other marketplace listings the owner must take down after a sale."""
        return [f"Take down on {name} ({state})" for name, state in (item.platforms or {}).items()
                if name != item.sale_platform]

    # -------------------------------------------------------------- heartbeat
    def beat(self) -> timedelta | None:
        """Update the heartbeat; returns detected downtime on the first beat after a gap."""
        with self.db.session() as s:
            hb = s.get(Heartbeat, 1)
            now = utcnow()
            if hb is None:
                s.add(Heartbeat(id=1, last_beat_at=now, started_at=now))
                return None
            gap = now - hb.last_beat_at
            hb.last_beat_at = now
            return gap if gap > timedelta(minutes=5) else None

    def set_paused(self, paused: bool) -> None:
        with self.db.session() as s:
            hb = s.get(Heartbeat, 1) or Heartbeat(id=1)
            hb.paused = paused
            s.merge(hb)
            self.event(s, "control", "paused" if paused else "resumed")

    def recent_events(self, limit: int = 30) -> list[dict]:
        with self.db.session() as s:
            return [{"at": e.at.isoformat(), "kind": e.kind, "message": e.message}
                    for e in s.scalars(select(SystemEvent).order_by(SystemEvent.id.desc()).limit(limit))]


def in_quiet_hours(cfg: Config, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    start, end = cfg.notifications.quiet_hours.split("-")
    s_h, s_m = map(int, start.split(":"))
    e_h, e_m = map(int, end.split(":"))
    cur, s_min, e_min = now.hour * 60 + now.minute, s_h * 60 + s_m, e_h * 60 + e_m
    return (s_min <= cur or cur < e_min) if s_min > e_min else (s_min <= cur < e_min)
