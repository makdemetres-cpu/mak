"""PAPER-mode simulation data. Everything created here is flagged is_paper=True.

Covers the brief's scenarios: excellent, normal, overpriced, negotiable-just-above-max,
scam-like, damaged, too far, very close (5 min), 55-min exceptional deal, unknown
condition, duplicate, Vendora→Facebook mirror, US eSIM-only, shipped Skoop purchase.
"""

from __future__ import annotations

import random
from datetime import timedelta
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import Config
from ..connectors.base import RawListing
from ..engine import pipeline, pricerules
from ..engine.valuation import battery_band
from ..models import InventoryItem, MarketComparable, utcnow

HERE = Path(__file__).parent

# Paper resale levels (typical observed asking price). Simulation only.
PAPER_RESALE = {
    ("iPhone 11", 64): 210, ("iPhone 11", 128): 235, ("iPhone 11 Pro", 64): 245,
    ("iPhone 11 Pro", 256): 280, ("iPhone 12", 64): 260, ("iPhone 12", 128): 290,
    ("iPhone 12 Pro", 128): 350, ("iPhone 12 Pro", 256): 385, ("iPhone 13", 128): 345,
    ("iPhone 13", 256): 385, ("iPhone 13 mini", 128): 300, ("iPhone 13 Pro", 128): 450,
    ("iPhone 13 Pro", 256): 495, ("iPhone 13 Pro Max", 128): 525, ("iPhone 14", 128): 440,
    ("iPhone 14", 256): 485, ("iPhone 14 Pro", 128): 590, ("iPhone 14 Pro", 256): 640,
    ("iPhone 14 Pro Max", 256): 730, ("iPhone 15", 128): 590, ("iPhone 15 Pro", 128): 780,
    ("iPhone 15 Pro", 256): 840,
}


def _comps(session: Session, rng: random.Random) -> None:
    now = utcnow()
    for (model, storage), typical in PAPER_RESALE.items():
        n = rng.randint(6, 16)
        for _ in range(n):
            kind = rng.choices(["ASKING", "DISAPPEARED", "MY_SALE"], [6, 3, 1])[0]
            session.add(MarketComparable(
                model=model, storage_gb=storage, kind=kind, marketplace="vendora", is_paper=True,
                price=round(typical * rng.uniform(0.9, 1.1)),
                condition_band=rng.choice(["excellent", "very_good", "very_good", "good"]),
                battery_band=battery_band(rng.randint(80, 100)),
                observed_at=now - timedelta(days=rng.uniform(0, 75))))


def scenarios() -> list[RawListing]:
    now = utcnow()
    ago = lambda minutes: now - timedelta(minutes=minutes)  # noqa: E731
    photos = lambda n, tag: ([f"/static/paper/phone.svg#{tag}{i}" for i in range(n)],  # noqa: E731
                             [f"{tag}-hash-{i}" for i in range(n)])
    out: list[RawListing] = []

    def add(key: str, **kw) -> None:
        imgs, hashes = photos(kw.pop("photos", 4), key)
        out.append(RawListing(external_id=f"paper-{key}", url=f"https://example.invalid/paper/{key}",
                              is_paper=True, source="paper", image_urls=imgs,
                              image_hashes=kw.pop("hashes", hashes), **kw))

    add("excellent", marketplace="vendora", title="iPhone 13 128GB Midnight",
        description="Σε πολύ καλή κατάσταση, μπαταρία 88%. Όλα γνήσια, δεν έχει ανοιχτεί ποτέ. "
                    "Με κουτί και καλώδιο. Face ID δουλεύει τέλεια.",
        price=235, location="Rafina", travel_minutes=18, location_confidence="HIGH",
        seller_id="s-anna", seller_rating=4.9, seller_account_age_days=900, listed_at=ago(7))
    add("very-close", marketplace="facebook", title="iPhone 12 128GB μπλε",
        description="Άριστη κατάσταση, battery 91%. Dual SIM. Πάντα με θήκη και τζαμάκι. "
                    "Face ID λειτουργεί. Αρτέμιδα, παραλαβή από το σπίτι.",
        price=190, location="Artemida", travel_minutes=5, location_confidence="HIGH",
        seller_id="s-nikos", seller_rating=4.7, seller_account_age_days=1500, listed_at=ago(22))
    add("normal", marketplace="vendora", title="iPhone 13 Pro 128GB Sierra Blue",
        description="Καλή κατάσταση με μερικές γρατζουνιές στο πλαίσιο. Μπαταρία 86%. "
                    "Με κουτί.", price=325, location="Pallini", travel_minutes=24,
        location_confidence="HIGH", seller_id="s-maria", seller_rating=4.6,
        seller_account_age_days=600, listed_at=ago(95))
    add("negotiable", marketplace="vendora", title="iPhone 14 128GB Starlight",
        description="Σαν καινούριο, μπαταρία 92%. Τιμή συζητήσιμη. Όλα γνήσια, με εγγύηση "
                    "μέχρι τον Μάρτιο.", price=348, location="Gerakas", travel_minutes=27,
        location_confidence="HIGH", seller_id="s-kostas", seller_rating=4.8,
        seller_account_age_days=700, listed_at=ago(40))
    add("overpriced", marketplace="vendora", title="iPhone 14 Pro 256GB Deep Purple",
        description="Άψογο, μπαταρία 90%, με κουτί.", price=620, location="Chalandri",
        travel_minutes=34, location_confidence="HIGH", seller_id="s-eleni",
        seller_rating=5.0, seller_account_age_days=400, listed_at=ago(300))
    add("scam", marketplace="facebook", title="iPhone 15 Pro 256GB σφραγισμένο",
        description="Καινούριο σφραγισμένο. Βρίσκομαι στο εξωτερικό, μόνο αποστολή. "
                    "Θέλω προκαταβολή 50€ για κράτηση. Στείλε μήνυμα στο viber.",
        price=420, location="Athens", travel_minutes=None, location_confidence="LOW",
        seller_id="s-new-01", seller_account_age_days=3, listed_at=ago(12), photos=1,
        hashes=["stock-apple-hash"])
    add("damaged", marketplace="facebook", title="iPhone 12 Pro 128GB ραγισμένη οθόνη",
        description="Ραγισμένη οθόνη στη γωνία, όλα τα άλλα λειτουργούν. Μπαταρία 83%.",
        price=170, location="Koropi", travel_minutes=16, location_confidence="HIGH",
        seller_id="s-giorgos", seller_rating=4.2, seller_account_age_days=300, listed_at=ago(180))
    add("too-far", marketplace="vendora", title="iPhone 13 128GB Pink",
        description="Πολύ καλή κατάσταση, μπαταρία 87%.", price=245, location="Elefsina",
        travel_minutes=72, location_confidence="HIGH", seller_id="s-far", seller_rating=4.5,
        seller_account_age_days=500, listed_at=ago(60))
    add("exceptional-55", marketplace="vendora", title="iPhone 14 Pro Max 256GB Space Black",
        description="Σαν καινούριο, μπαταρία 95%, όλα γνήσια, με κουτί. Χρειάζομαι γρήγορα χρήματα.",
        price=470, location="Acharnes", travel_minutes=55, location_confidence="HIGH",
        seller_id="s-fast", seller_rating=4.9, seller_account_age_days=1200, listed_at=ago(15))
    add("unknown", marketplace="facebook", title="iphone 13 128",
        description="", price=240, location="Spata", travel_minutes=14, location_confidence="MEDIUM",
        seller_id="s-min", listed_at=ago(30), photos=1)
    add("esim-us", marketplace="vendora", title="iPhone 14 128GB Midnight (US model)",
        description="US model, eSIM only, χωρίς θέση SIM. Πολύ καλή κατάσταση, μπαταρία 89%.",
        price=290, location="Glyfada", travel_minutes=38, location_confidence="HIGH",
        seller_id="s-us", seller_rating=4.7, seller_account_age_days=800, listed_at=ago(200))
    add("skoop-shipped", marketplace="skoop", title="iPhone 13 mini 128GB Red",
        description="Άριστη κατάσταση, μπαταρία 90%, όλα γνήσια.", price=205, delivery="shipped",
        seller_id="s-skoop", seller_rating=4.8, seller_account_age_days=1000, listed_at=ago(50))
    add("vendora-src", marketplace="vendora", title="iPhone 12 64GB White",
        description="Πολύ καλή κατάσταση, μπαταρία 88%, με φορτιστή.", price=170,
        location="Markopoulo", travel_minutes=12, location_confidence="HIGH", seller_id="s-mirror",
        seller_rating=4.6, seller_account_age_days=650, listed_at=ago(70), hashes=["mirror-a", "mirror-b"])
    add("fb-mirror", marketplace="facebook", title="iPhone 12 64GB White",
        description="Πολύ καλή κατάσταση, μπαταρία 88%, με φορτιστή. Διαθέσιμο στο Vendora.",
        price=170, location="Markopoulo", travel_minutes=12, location_confidence="MEDIUM",
        listed_at=ago(65), hashes=["mirror-a", "mirror-b"])
    add("icloud", marketplace="facebook", title="iPhone 13 Pro 256GB",
        description="Κλειδωμένο σε iCloud, για ανταλλακτικά.", price=150, location="Piraeus",
        travel_minutes=45, location_confidence="MEDIUM", seller_id="s-lock", listed_at=ago(80))
    add("wanted", marketplace="facebook", title="Αγοράζω iPhone 13 128GB",
        description="Αγοράζω iPhone 13 έως 200€.", price=200, location="Athens",
        travel_minutes=None, listed_at=ago(10))
    return out


_INVENTORY = [
    # code, model, storage, status, path, cost, predicted_sale, listing_price, days_ago
    ("iPhone 13", 128, "LISTED", "in_person", 240, 335, 349, 6, 89),
    ("iPhone 13 Pro", 256, "READY_TO_LIST", "in_person", 365, 480, None, 2, 91),
    ("iPhone 12", 128, "REPAIR", "in_person", 200, 280, None, 4, 82),
    ("iPhone 14", 128, "RETURN_WINDOW", "shipped", 325, 425, None, 1, 93),
    ("iPhone 13 mini", 128, "INSPECTION", "in_person", None, 290, None, 0, None),
    ("iPhone 14 Pro", 128, "NEGOTIATING", "in_person", 440, 570, 589, 9, 88),
]


def _inventory(session: Session, rng: random.Random) -> None:
    now = utcnow()
    n = 0

    def code() -> str:
        nonlocal n
        n += 1
        return f"INV-{n:05d}"

    # completed flips over the last year → realized profit history
    pairs = list(PAPER_RESALE.items())
    for _ in range(26):
        (model, storage), typical = rng.choice(pairs)
        bought = now - timedelta(days=rng.uniform(12, 360))
        days = rng.randint(3, 21)
        cost = round(typical * rng.uniform(0.66, 0.76))
        sale = round(typical * rng.uniform(0.93, 1.03))
        fees = round(sale * 0.0, 2)
        predicted = round(typical * 0.97)
        session.add(InventoryItem(
            code=code(), model=model, storage_gb=storage, status="COMPLETED", is_paper=True,
            purchase_cost=cost, predicted_sale=predicted, predicted_profit=round(predicted - cost - 15),
            predicted_score=rng.randint(68, 96), listing_price=sale + 9, sale_price=sale,
            sale_platform=rng.choice(["vendora", "vendora", "facebook", "skoop"]), fees_paid=fees,
            repair_cost=rng.choice([0, 0, 0, 25]), battery_health=rng.randint(84, 97),
            condition=rng.choice(["excellent", "very_good", "good"]),
            purchased_at=bought, listed_at=bought + timedelta(days=1),
            sold_at=bought + timedelta(days=days)))
    for model, storage, status, path, cost, predicted, listing_price, days, bh in _INVENTORY:
        bought = now - timedelta(days=days)
        item = InventoryItem(
            code=code(), model=model, storage_gb=storage, status=status, purchase_path=path,
            is_paper=True, purchase_cost=cost, predicted_sale=predicted,
            predicted_profit=round(predicted - (cost or predicted * 0.72) - 15),
            listing_price=listing_price, battery_health=bh, condition="very_good",
            purchased_at=bought if cost else None, listed_at=bought if listing_price else None,
            repair_cost=35 if status == "REPAIR" else 0,
            platforms={"vendora": "ACTIVE", "skoop": "PENDING REVIEW", "vinted": "DRAFT (assisted)"}
            if status == "LISTED" else {})
        if status == "RETURN_WINDOW":
            item.return_window_ends_at = now + timedelta(hours=31)
        session.add(item)
    for item in session.scalars(select(InventoryItem).where(InventoryItem.status == "COMPLETED")):
        item.net_profit = round(item.sale_price - item.purchase_cost - item.repair_cost - item.fees_paid, 2)


def seed(session: Session, cfg: Config, seed_value: int = 7) -> dict:
    """Idempotent: does nothing if paper data already exists."""
    if session.scalar(select(func.count()).select_from(MarketComparable)
                      .where(MarketComparable.is_paper)):
        return {"seeded": False}
    rng = random.Random(seed_value)
    if pricerules.active_version(session) is None:
        pricerules.import_file(session, HERE / "sample_price_rules.csv", is_sample=True)
    _comps(session, rng)
    session.flush()
    alerts = []
    for raw in scenarios():
        result = pipeline.ingest(session, cfg, raw)
        if result.should_alert:
            pipeline.mark_alerted(result.listing)
            alerts.append(result.listing.id)
    # the duplicate scenario: the excellent deal seen again on the next scan
    again = next(r for r in scenarios() if r.external_id == "paper-excellent")
    dup = pipeline.ingest(session, cfg, again)
    assert not dup.is_new and not dup.should_alert
    _inventory(session, rng)
    return {"seeded": True, "alerts": alerts}
