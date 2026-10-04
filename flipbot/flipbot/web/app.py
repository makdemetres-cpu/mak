"""Local dashboard + JSON API. Binds to 127.0.0.1 by default — never expose it publicly."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

import secrets as secrets_mod

from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import select

from ..config import Config, Secrets, load_config
from ..db import Database
from ..engine import inspection, negotiation, pricerules
from ..models import Inspection, InventoryItem, Listing, PriceRule
from ..service import INVENTORY_STATUSES, TRANSITIONS, FlipDesk, TransitionError

STATIC = Path(__file__).parent / "static"
log = logging.getLogger("flipbot.web")


def listing_json(x: Listing, mirrors: list[Listing] | None = None) -> dict:
    return {
        "id": x.id, "marketplace": x.marketplace, "title": x.title, "url": x.url, "price": x.price,
        "model": x.model, "storage_gb": x.storage_gb, "color": x.color,
        "battery_health": x.battery_health, "condition": x.condition, "sim_type": x.sim_type,
        "negotiable": x.negotiable, "delivery": x.delivery, "location": x.location,
        "travel_minutes": x.travel_minutes, "location_confidence": x.location_confidence,
        "tier": x.tier, "deal_score": x.deal_score, "risk_level": x.risk_level,
        "my_max_buy": x.my_max_buy, "expected_sale": x.expected_sale, "net_profit": x.net_profit,
        "roi_percent": x.roi_percent, "listed_at": x.listed_at.isoformat() if x.listed_at else None,
        "first_seen_at": x.first_seen_at.isoformat(), "is_paper": x.is_paper, "source": x.source,
        "photos": len(x.image_urls or []), "evaluation": x.evaluation, "decision": x.decision,
        "description": x.description,
        "mirrors": [{"id": m.id, "marketplace": m.marketplace} for m in (mirrors or [])],
    }


def item_json(i: InventoryItem) -> dict:
    out = {c.name: getattr(i, c.name) for c in InventoryItem.__table__.columns}
    for k, v in out.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
    out["allowed"] = sorted(TRANSITIONS.get(i.status, set()))
    return out


class TextIn(BaseModel):
    text: str


class DecisionIn(BaseModel):
    decision: str


class TransitionIn(BaseModel):
    status: str
    purchase_cost: float | None = None
    repair_cost: float | None = None
    listing_price: float | None = None
    sale_price: float | None = None
    sale_platform: str | None = None
    fees_paid: float | None = None


class InspectionItemIn(BaseModel):
    result: str
    note: str | None = None


def create_app(cfg: Config | None = None, db: Database | None = None,
               secrets: Secrets | None = None, background: bool = True) -> FastAPI:
    cfg = cfg or load_config()
    db = db or Database(cfg.database_path)
    desk = FlipDesk(cfg, db, secrets if secrets is not None else Secrets.from_env())
    if cfg.mode == "PAPER":
        from ..paper.seed import seed
        with db.session() as s:
            seed(s, cfg)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        runtime = None
        if background:
            from ..runtime import Runtime
            runtime = Runtime(desk)
            await runtime.start()
        yield
        if runtime:
            await runtime.stop()

    app = FastAPI(title="FlipDesk", lifespan=lifespan, docs_url="/api/docs")
    app.state.desk = desk

    @app.get("/api/overview")
    def overview():
        return desk.overview()

    @app.get("/api/deals")
    def deals(tier: str | None = None, delivery: str | None = None):
        tiers = tuple(tier.split(",")) if tier else ("HOT", "GOOD", "NEGOTIATE", "WATCH")
        return [listing_json(x) for x in desk.deals(tiers, delivery)]

    @app.get("/api/listings")
    def listings():
        return [listing_json(x) for x in desk.all_listings()]

    @app.get("/api/listings/{listing_id}")
    def listing(listing_id: int):
        found = desk.listing(listing_id)
        if not found:
            raise HTTPException(404, "listing not found")
        row, mirrors = found
        data = listing_json(row, mirrors)
        data["negotiation"] = negotiation.plan(cfg, row)
        data["drafts"] = negotiation.drafts(cfg, row)
        return data

    @app.post("/api/listings/{listing_id}/decision")
    def decide(listing_id: int, body: DecisionIn):
        try:
            item = desk.decide(listing_id, body.decision)
        except KeyError:
            raise HTTPException(404, "listing not found")
        except ValueError as exc:
            raise HTTPException(400, str(exc))
        return {"ok": True, "inventory": item_json(item) if item else None}

    @app.post("/api/intake")
    async def intake(body: TextIn):
        try:
            row, result = desk.intake_text(body.text)
        except ValueError as exc:
            raise HTTPException(422, str(exc))
        if result.should_alert and desk.notify:
            await desk.notify(row, result.alert_reason or "new")
        found = desk.listing(row.id)
        return {**listing_json(*found), "is_new": result.is_new,
                "duplicate_of": result.duplicate_of.id if result.duplicate_of else None}

    @app.get("/api/inventory")
    def inventory():
        return {"statuses": INVENTORY_STATUSES, "items": [item_json(i) for i in desk.inventory()]}

    @app.post("/api/inventory/{item_id}/transition")
    def transition(item_id: int, body: TransitionIn):
        fields = body.model_dump(exclude={"status"}, exclude_none=True)
        try:
            item = desk.transition(item_id, body.status, **fields)
        except KeyError:
            raise HTTPException(404, "item not found")
        except TransitionError as exc:
            raise HTTPException(409, str(exc))
        out = item_json(item)
        if body.status == "SOLD":
            out["takedown"] = desk.mark_sold_cleanup(item)
        return out

    @app.post("/api/inventory/{item_id}/inspection")
    def start_inspection(item_id: int):
        with db.session() as s:
            item = s.get(InventoryItem, item_id)
            if not item:
                raise HTTPException(404, "item not found")
            path = "on_arrival" if item.purchase_path == "shipped" else "in_person"
            insp = inspection.start(s, path, inventory_id=item.id, listing_id=item.listing_id)
            return _inspection_json(insp)

    @app.get("/api/inspections/{inspection_id}")
    def get_inspection(inspection_id: int):
        with db.session() as s:
            insp = s.get(Inspection, inspection_id)
            if not insp:
                raise HTTPException(404, "inspection not found")
            return _inspection_json(insp)

    @app.post("/api/inspection-items/{item_id}")
    def record_item(item_id: int, body: InspectionItemIn):
        with db.session() as s:
            try:
                inspection.record(s, item_id, body.result, body.note)
            except (KeyError, ValueError) as exc:
                raise HTTPException(400, str(exc))
        return {"ok": True}

    @app.post("/api/inspections/{inspection_id}/decision")
    def inspection_decision(inspection_id: int, body: DecisionIn):
        with db.session() as s:
            try:
                insp = inspection.decide(s, inspection_id, body.decision)
            except KeyError:
                raise HTTPException(404, "inspection not found")
            except ValueError as exc:
                raise HTTPException(409, str(exc))
            out = _inspection_json(insp)
            if body.decision == "RETURN":
                out["return_text"] = inspection.return_request_text(insp)
            desk.event(s, "inspection", f"Inspection {insp.id}: {body.decision}")
            return out

    @app.get("/api/profit")
    def profit(days: int = 365):
        return desk.profit_series(days)

    @app.get("/api/analytics")
    def analytics():
        done = [i for i in desk.inventory({"COMPLETED"}) if i.net_profit is not None]
        buckets: dict[str, list] = {}
        for i in done:
            if i.predicted_score is None:
                continue
            key = "90+" if i.predicted_score >= 90 else "80–89" if i.predicted_score >= 80 else \
                "70–79" if i.predicted_score >= 70 else "<70"
            buckets.setdefault(key, []).append(i)
        by_model: dict[str, list] = {}
        for i in done:
            by_model.setdefault(i.model, []).append(i)
        avg = lambda xs: round(sum(xs) / len(xs), 1) if xs else None  # noqa: E731
        days_to_sell = lambda i: (i.sold_at - i.listed_at).days if i.sold_at and i.listed_at else None  # noqa: E731
        return {
            "score_buckets": [{"bucket": k, "n": len(v), "actual": avg([i.net_profit for i in v]),
                               "predicted": avg([i.predicted_profit for i in v if i.predicted_profit is not None])}
                              for k, v in sorted(buckets.items(), reverse=True)],
            "models": sorted([{"model": k, "n": len(v), "profit": round(sum(i.net_profit for i in v), 2),
                               "avg_days": avg([d for d in map(days_to_sell, v) if d is not None]),
                               "avg_roi": avg([i.net_profit / i.purchase_cost * 100 for i in v if i.purchase_cost])}
                              for k, v in by_model.items()], key=lambda r: -r["profit"]),
            "platforms": [{"platform": p, "n": len(xs), "profit": round(sum(i.net_profit for i in xs), 2)}
                          for p in sorted({i.sale_platform for i in done if i.sale_platform})
                          for xs in [[i for i in done if i.sale_platform == p]]],
        }

    @app.get("/api/connectors")
    def connectors():
        return desk.connector_rows()

    @app.get("/api/settings")
    def settings():
        with db.session() as s:
            version = pricerules.active_version(s)
            rules = [] if not version else [
                {"model": r.model, "storage_gb": r.storage_gb, "max_buy_price": r.max_buy_price,
                 "min_battery_health": r.min_battery_health, "notes": r.notes}
                for r in s.scalars(select(PriceRule).where(PriceRule.version_id == version.id)
                                   .order_by(PriceRule.model, PriceRule.storage_gb))]
            vinfo = None if not version else {"id": version.id, "source": version.source_name,
                                              "imported_at": version.imported_at.isoformat(),
                                              "is_sample": version.is_sample, "report": version.report}
        return {"config": cfg.model_dump(), "blockers": desk.overview()["live_blockers"],
                "price_rules": rules, "price_rule_version": vinfo,
                "telegram_enabled": bool(desk.secrets.telegram_bot_token),
                "claude_enabled": bool(desk.secrets.anthropic_api_key)}

    @app.post("/api/price-rules")
    async def upload_rules(file: UploadFile = File(...)):
        content = await file.read()
        with db.session() as s:
            try:
                version, report = pricerules.import_rules(s, file.filename or "upload.csv", content)
            except ValueError as exc:
                raise HTTPException(422, str(exc))
            desk.event(s, "price_rules", f"Imported {report.imported} rules from {file.filename}")
            # re-score everything against the new rules
            from ..engine import pipeline
            for row in s.scalars(select(Listing).where(Listing.status == "ACTIVE")):
                pipeline.evaluate(s, cfg, row)
            return {"version_id": version.id, "report": report.as_dict()}

    @app.post("/api/admin/shutdown")
    def shutdown(x_flipdesk_token: str | None = Header(default=None)):
        """Used by `python -m flipbot stop` (stop.bat). The token lives in data/runtime.json
        on this PC; a custom header also means no web page can trigger this cross-site."""
        token = getattr(app.state, "control_token", None)
        if not token or not x_flipdesk_token or not secrets_mod.compare_digest(token, x_flipdesk_token):
            raise HTTPException(403, "forbidden")
        server = getattr(app.state, "server", None)
        if server is None:
            raise HTTPException(503, "not running under the FlipDesk launcher")
        log.info("Shutdown requested via stop command")
        server.should_exit = True
        return {"ok": True}

    @app.get("/api/events")
    def events():
        return desk.recent_events()

    app.mount("/static", StaticFiles(directory=STATIC), name="static")

    @app.get("/")
    def index():
        return FileResponse(STATIC / "index.html")

    return app


def _inspection_json(insp: Inspection) -> dict:
    return {"id": insp.id, "path": insp.path, "decision": insp.decision, "inventory_id": insp.inventory_id,
            "items": [{"id": i.id, "section": i.section, "label": i.label, "result": i.result,
                       "note": i.note} for i in insp.items]}
