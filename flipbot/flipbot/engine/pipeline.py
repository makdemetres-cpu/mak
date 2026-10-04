"""The deal pipeline: dedup → parse → rules → valuation → profit → risk → score → tier."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import Config, setting
from ..connectors.base import RawListing
from ..models import Listing, ListingSnapshot, ListingSource, SystemEvent, utcnow
from . import location as loc
from . import parsing, pricerules, profit, risk, scoring, valuation

HOT, GOOD, NEGOTIATE, WATCH, REJECTED = "HOT", "GOOD", "NEGOTIATE", "WATCH", "REJECTED"
ALERT_TIERS = (HOT, GOOD, NEGOTIATE)


@dataclass
class IngestResult:
    listing: Listing
    is_new: bool
    duplicate_of: Listing | None
    should_alert: bool
    alert_reason: str | None


def content_hash(raw: RawListing) -> str:
    h = hashlib.sha256(f"{raw.title}|{raw.description}|{raw.price}".encode()).hexdigest()
    return h[:32]


def _find_existing(session: Session, raw: RawListing) -> Listing | None:
    if raw.external_id:
        hit = session.scalars(select(Listing).where(
            Listing.marketplace == raw.marketplace, Listing.external_id == raw.external_id)).first()
        if hit:
            return hit
    if raw.url:
        return session.scalars(select(Listing).where(Listing.url == raw.url)).first()
    return None


def _find_cross_duplicate(session: Session, listing: Listing) -> tuple[Listing, str] | None:
    """Same item elsewhere: Vendora→Facebook mirror, same seller+model+price, or shared photo hash."""
    if not listing.model:
        return None
    candidates = session.scalars(select(Listing).where(
        Listing.id != listing.id, Listing.model == listing.model,
        Listing.storage_gb == listing.storage_gb, Listing.duplicate_of_id.is_(None))).all()
    hashes = set(listing.image_hashes or [])
    for other in candidates:
        if hashes and hashes & set(other.image_hashes or []):
            mirror = {listing.marketplace, other.marketplace} == {"facebook", "vendora"}
            return other, "vendora_mirror" if mirror else "image_hash"
        if listing.seller_id and listing.seller_id == other.seller_id and \
                abs(listing.price - other.price) < 1:
            return other, "same_seller_model_price"
        text = parsing.fold(f"{listing.url or ''} {listing.description}")
        if listing.marketplace == "facebook" and other.marketplace == "vendora" and "vendora" in text \
                and abs(listing.price - other.price) <= 5:
            return other, "vendora_mirror"
    return None


def ingest(session: Session, cfg: Config, raw: RawListing) -> IngestResult:
    existing = _find_existing(session, raw)
    now = utcnow()
    if existing:
        old_price = existing.price
        existing.last_seen_at = now
        existing.status = "ACTIVE"
        if abs(raw.price - old_price) >= 0.5:
            existing.price = raw.price
            existing.content_hash = content_hash(raw)
            session.add(ListingSnapshot(listing=existing, price=raw.price, status="ACTIVE"))
            evaluate(session, cfg, existing)
        alert, reason = _alert_decision(cfg, existing)
        return IngestResult(existing, False, None, alert, reason)

    listing = Listing(
        marketplace=raw.marketplace, external_id=raw.external_id, url=raw.url, title=raw.title,
        description=raw.description, price=raw.price, delivery=raw.delivery,
        location=raw.location, travel_minutes=raw.travel_minutes, distance_km=raw.distance_km,
        location_confidence=raw.location_confidence, seller_id=raw.seller_id,
        seller_rating=raw.seller_rating, seller_account_age_days=raw.seller_account_age_days,
        image_urls=raw.image_urls, image_hashes=raw.image_hashes, listed_at=raw.listed_at,
        is_paper=raw.is_paper, source=raw.source, content_hash=content_hash(raw),
        evaluation={"structured": raw.structured},
    )
    session.add(listing)
    session.flush()
    session.add(ListingSnapshot(listing=listing, price=raw.price, status="ACTIVE"))
    evaluate(session, cfg, listing)

    dup = _find_cross_duplicate(session, listing)
    if dup:
        primary, why = dup
        listing.duplicate_of_id = primary.id
        session.add(ListingSource(primary_listing_id=primary.id, linked_listing_id=listing.id, reason=why))
        session.add(SystemEvent(kind="dedup", message=f"Linked #{listing.id} to #{primary.id} ({why})"))
        return IngestResult(listing, True, primary, False, None)

    alert, reason = _alert_decision(cfg, listing)
    return IngestResult(listing, True, None, alert, reason)


def _alert_decision(cfg: Config, listing: Listing) -> tuple[bool, str | None]:
    if listing.duplicate_of_id or listing.tier not in ALERT_TIERS:
        return False, None
    if listing.alerted_price is None:
        return True, "new"
    drop = listing.alerted_price - listing.price
    if drop >= float(setting(cfg, "deal_rules.price_drop_realert_eur") or 1e9):
        return True, f"price drop €{drop:.0f}"
    return False, None


def evaluate(session: Session, cfg: Config, listing: Listing) -> Listing:
    structured = (listing.evaluation or {}).get("structured", {})
    p = parsing.parse(listing.title, listing.description, structured)
    listing.model, listing.storage_gb, listing.color = p.model, p.storage_gb, p.color
    listing.battery_health = p.battery_health.value
    listing.battery_cycles = p.battery_cycles
    listing.condition = p.condition.value
    listing.sim_type = p.sim_type.value
    listing.negotiable = p.negotiable

    rejects: list[str] = []
    warnings: list[str] = []
    positives: list[str] = []
    ev: dict = {"structured": structured, "facts": {
        "battery_health": [p.battery_health.value, p.battery_health.certainty],
        "condition": [p.condition.value, p.condition.certainty],
        "face_id": [p.face_id.value, p.face_id.certainty],
        "repairs": [p.repairs.value, p.repairs.certainty],
        "sim_type": [p.sim_type.value, p.sim_type.certainty],
        "box": p.has_box, "charger": p.has_charger, "warranty": p.warranty_mentioned,
        "battery_cycles": p.battery_cycles,
    }, "needs_ai": p.needs_ai}

    # --- hard filters ---------------------------------------------------
    allow_face = cfg.risk.allow_face_id_broken
    for code, reason in p.hard_rejects:
        if code == "face_id_broken" and allow_face:
            continue
        if code in ("for_parts", "motherboard") and cfg.risk.parts_mode:
            continue
        rejects.append(reason)
    if p.is_wanted_ad:
        rejects.append("Wanted ad (αγοράζω), not a sale")
    if p.is_exchange_only:
        rejects.append("Exchange only")
    if p.is_accessory:
        rejects.append("Accessory, not a phone")
    if p.model and p.model not in cfg.target_models:
        rejects.append(f"{p.model} is not a target model")
    if p.sim_type.value == "esim_only_us" and setting(cfg, "risk.allow_esim_only_us_models") is False:
        rejects.append("US eSIM-only units are disabled in settings")
    min_battery = int(setting(cfg, "risk.minimum_battery_health") or 0)

    rule = pricerules.lookup(session, p.model, p.storage_gb)
    if p.model and p.storage_gb and not rule:
        rejects.append(f"No max-buy price for {p.model} {p.storage_gb}GB in my spreadsheet")
    if p.model is None or p.storage_gb is None:
        warnings.append("Model/storage unclear — needs AI or manual review")
    if rule and rule.min_battery_health:
        min_battery = max(min_battery, rule.min_battery_health)
    if p.battery_health.value is not None and p.battery_health.value < min_battery:
        warnings.append(f"Battery {p.battery_health.value}% < minimum {min_battery}%")
    if p.battery_health.value is None and setting(cfg, "risk.allow_unknown_battery_health") is False:
        rejects.append("Battery health unknown (disallowed in settings)")
    if p.repairs.value and setting(cfg, "risk.allow_repaired_devices") is False:
        rejects.append("Repaired device (disallowed in settings)")

    val = valuation.value(session, p.model, p.storage_gb, p.condition.value, p.battery_health.value) \
        if p.model and p.storage_gb else None
    listing.my_max_buy = rule.max_buy_price if rule else None
    ev["rule"] = {"max_buy": rule.max_buy_price, "version_id": rule.version_id} if rule else None
    ev["valuation"] = val.as_dict() if val else None
    if rule and not val:
        warnings.append("No market comparables yet — profit unknown")

    # --- economics --------------------------------------------------------
    min_profit = float(setting(cfg, "deal_rules.minimum_profit_eur") or 0)
    min_roi = float(setting(cfg, "deal_rules.minimum_roi_percent") or 0)
    band = float(setting(cfg, "profit_rules.negotiation_band_eur") or 0)
    buffer_pct = float(setting(cfg, "profit_rules.negotiation_buffer_percent") or 0)
    extra_repair = 40.0 if p.condition.value == "damaged" else 0.0

    pb = nb = None
    if val:
        pb = profit.estimate(cfg, val.expected_sale, listing.price, listing.travel_minutes,
                             listing.distance_km, extra_repair, delivery=listing.delivery)
        listing.expected_sale = round(val.expected_sale, 2)
        listing.net_profit = round(pb.net_profit, 2)
        listing.roi_percent = round(pb.roi_percent, 1)
        ev["profit"] = pb.as_dict()
        if p.negotiable:
            nb = profit.estimate(cfg, val.expected_sale, listing.price * (1 - buffer_pct / 100),
                                 listing.travel_minutes, listing.distance_km, extra_repair,
                                 delivery=listing.delivery)
            ev["profit_negotiated"] = nb.as_dict()

    verdict = loc.score_location(listing.travel_minutes, cfg.location, listing.delivery,
                                 pb.net_profit if pb else None,
                                 setting(cfg, "location.exceptional_deal_override.min_expected_profit_eur"))
    ev["location"] = {"tier": verdict.tier, "override": verdict.override_applied}
    if verdict.excluded:
        rejects.append(f"~{listing.travel_minutes:.0f} min away — beyond the {cfg.location.hard_max_minutes} min hard max")
    if verdict.override_applied:
        warnings.append("Beyond hard max, kept by the exceptional-deal override")

    # --- risk (separate gate) ---------------------------------------------
    reused = _photo_reused(session, listing)
    rk = risk.assess(listing.title, listing.description, listing.price, val.typical if val else None,
                     listing.delivery, len(listing.image_urls or []), listing.seller_account_age_days,
                     listing.seller_rating, reused, any(c == "icloud_lock" for c, _ in p.hard_rejects))
    listing.risk_level = rk.level
    ev["risk"] = {"level": rk.level, "points": rk.points, "reasons": rk.reasons}

    # --- score -------------------------------------------------------------
    card = None
    if rule and val and pb:
        price_frac, price_reason = scoring.price_opportunity(listing.price, rule.max_buy_price,
                                                             p.negotiable, band)
        cond_frac, cond_notes = scoring.condition_fraction(p, min_battery)
        q_frac, q_reason = scoring.listing_quality(p, len(listing.image_urls or []), listing.description)
        loc_reason = "shipped" if listing.delivery == "shipped" else (
            f"~{listing.travel_minutes:.0f} min · {verdict.tier}" if listing.travel_minutes is not None
            else "travel time unknown")
        card = scoring.build(cfg.deal_score_weights, price_frac=price_frac, price_reason=price_reason,
                             profit=pb.net_profit, min_profit=min_profit, cond_frac=cond_frac,
                             cond_notes=cond_notes, quality_frac=q_frac, quality_reason=q_reason,
                             loc_frac=verdict.score, loc_reason=loc_reason, liquidity=val.liquidity)
        listing.deal_score = card.total
        ev["components"] = [c.as_dict() for c in card.components]
    else:
        listing.deal_score = None
        ev["components"] = []

    # --- tier --------------------------------------------------------------
    tier = None
    if not rejects and rule and pb:
        over = listing.price - rule.max_buy_price
        if over > 0:
            if over <= band and (nb or pb).net_profit >= min_profit and rk.level != "HIGH":
                tier = NEGOTIATE
            else:
                rejects.append(f"€{over:.0f} above my max and outside the €{band:.0f} negotiation band")
        elif pb.net_profit < min_profit:
            rejects.append(f"Expected profit €{pb.net_profit:.0f} < my minimum €{min_profit:.0f}")
        elif pb.roi_percent < min_roi:
            rejects.append(f"ROI {pb.roi_percent:.0f}% < my minimum {min_roi:.0f}%")
    if rejects:
        tier = REJECTED
    elif tier is None:
        hot = float(setting(cfg, "deal_rules.hot_min_score") or 101)
        good = float(setting(cfg, "deal_rules.good_min_score") or 101)
        score = listing.deal_score or 0
        if rk.level == "LOW" and score >= hot:
            tier = HOT
        elif rk.level != "HIGH" and score >= good:
            tier = GOOD
        else:
            tier = WATCH
    if rk.level == "HIGH":
        warnings.insert(0, "HIGH RISK — " + "; ".join(rk.reasons))
    listing.tier = tier

    # --- explanation ---------------------------------------------------------
    if rule and listing.price <= rule.max_buy_price:
        positives.append(f"€{rule.max_buy_price - listing.price:.0f} below max buy")
    if pb and pb.net_profit >= min_profit:
        positives.append(f"€{pb.net_profit:.0f} expected profit")
    if val and val.liquidity >= 0.7:
        positives.append("strong resale demand")
    if verdict.tier in (loc.EXCELLENT, loc.VERY_GOOD):
        positives.append("close location")
    if listing.listed_at and (utcnow() - listing.listed_at).total_seconds() < 3600:
        positives.append("fresh listing")
    if p.face_id.value is None:
        warnings.append("Test Face ID in person" if listing.delivery == "pickup" else "Test Face ID on arrival")
    if p.repairs.value is None:
        warnings.append("Check Parts and Service History")
    elif p.repairs.value:
        warnings.append("Repairs: " + ", ".join(p.repairs.value) + " — price it in")
    if p.sim_type.value == "esim_only_us":
        warnings.append("US eSIM-only — no SIM tray, lower resale in Greece")
    if p.battery_health.value is None:
        warnings.append("Battery health unknown")
    ev.update(rejects=rejects, warnings=warnings, positives=positives)
    listing.evaluation = ev
    return listing


def _photo_reused(session: Session, listing: Listing) -> bool:
    hashes = set(listing.image_hashes or [])
    if not hashes:
        return False
    others = session.scalars(select(Listing).where(Listing.id != listing.id,
                                                   Listing.seller_id != listing.seller_id)).all()
    for other in others:
        mirror = {listing.marketplace, other.marketplace} == {"facebook", "vendora"}
        if not mirror and hashes & set(other.image_hashes or []):
            return True
    return False


def mark_alerted(listing: Listing) -> None:
    listing.alerted_price = listing.price
