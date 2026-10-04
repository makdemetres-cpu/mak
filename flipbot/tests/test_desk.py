from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from flipbot.config import Secrets
from flipbot.engine import inspection
from flipbot.runtime import backup
from flipbot.service import FlipDesk, TransitionError, in_quiet_hours
from flipbot.telegram_bot import TelegramBot, deal_card, is_allowed
from flipbot.web.app import create_app


@pytest.fixture
def desk(db, cfg):
    from flipbot.paper.seed import seed
    with db.session() as s:
        seed(s, cfg)
    return FlipDesk(cfg, db, Secrets("t", frozenset({42}), None, None))


def test_in_person_purchase_requires_inspection(desk):
    hot = desk.deals(("HOT",))[0]
    item = desk.decide(hot.id, "APPROVED")
    assert item.status == "APPROVED" and item.predicted_profit == hot.net_profit
    desk.transition(item.id, "INSPECTION")
    with pytest.raises(TransitionError):
        desk.transition(item.id, "PURCHASED", purchase_cost=230)
    with desk.db.session() as s:
        insp = inspection.start(s, "in_person", inventory_id=item.id)
        with pytest.raises(ValueError):
            inspection.decide(s, insp.id, "BUY")  # items still UNKNOWN
        for i in insp.items:
            inspection.record(s, i.id, "PASS")
        inspection.decide(s, insp.id, "BUY")
    done = desk.transition(item.id, "PURCHASED", purchase_cost=230)
    assert done.status == "PURCHASED" and done.purchase_cost == 230


def test_failed_find_my_blocks_buy(db):
    with db.session() as s:
        insp = inspection.start(s, "in_person")
        for i in insp.items:
            inspection.record(s, i.id, "FAIL" if "Find My" in i.label else "PASS")
        with pytest.raises(ValueError):
            inspection.decide(s, insp.id, "BUY")


def test_shipped_path_return_window(desk):
    skoop = next(d for d in desk.deals() if d.delivery == "shipped")
    item = desk.decide(skoop.id, "APPROVED")
    assert item.purchase_path == "shipped"
    desk.transition(item.id, "IN_TRANSIT")
    item = desk.transition(item.id, "RETURN_WINDOW")
    hours = (item.return_window_ends_at - datetime.utcnow()).total_seconds() / 3600
    assert 47.5 < hours <= 48
    with desk.db.session() as s:
        insp = inspection.start(s, "on_arrival", inventory_id=item.id)
        assert all(i.section != inspection.IN_PERSON_ONLY for i in insp.items)
        insp.items[0].result = "FAIL"
        inspection.decide(s, insp.id, "RETURN")
        assert "επιστροφή" in inspection.return_request_text(insp)
    with pytest.raises(TransitionError):
        desk.transition(item.id, "PURCHASED")
    desk.transition(item.id, "RETURNED")


def test_sale_completes_with_profit_and_takedown_list(desk):
    item = next(i for i in desk.inventory({"LISTED"}))
    sold = desk.transition(item.id, "SOLD", sale_price=340, sale_platform="vendora")
    assert desk.mark_sold_cleanup(sold) == ["Take down on skoop (PENDING REVIEW)", "Take down on vinted (DRAFT (assisted))"]
    done = desk.transition(item.id, "COMPLETED", fees_paid=4)
    assert done.net_profit == 340 - 240 - 0 - 4


def test_intake_text(desk):
    listing, result = desk.intake_text("https://www.vendora.gr/items/1\niPhone 13 Pro 256GB 330€ συζητήσιμη\nμπαταρία 86%, Ραφήνα")
    assert listing.marketplace == "vendora" and listing.model == "iPhone 13 Pro"
    assert listing.location == "Rafina" and listing.location_confidence == "LOW"  # no routing cache yet
    with pytest.raises(ValueError):
        desk.intake_text("iPhone 13 no price here")


def test_telegram_whitelist_and_card(desk):
    assert is_allowed(42, desk.secrets.telegram_allowed_user_ids)
    assert not is_allowed(7, desk.secrets.telegram_allowed_user_ids)
    assert not is_allowed(None, desk.secrets.telegram_allowed_user_ids)
    hot = desk.deals(("HOT",))[0]
    card = deal_card(hot, paper=True)
    assert card.startswith("[PAPER] 🔥 HOT") and "Risk LOW" in card and "My max" in card
    bot = TelegramBot(desk)
    assert "PAPER mode" in bot.command_text("status", [])
    assert "LIVE is blocked" in bot.command_text("settings", [])
    bot.command_text("pause", [])
    assert desk.overview()["paused"]


def test_quiet_hours(cfg):
    assert in_quiet_hours(cfg, datetime(2026, 1, 1, 23, 30))
    assert in_quiet_hours(cfg, datetime(2026, 1, 1, 7, 59))
    assert not in_quiet_hours(cfg, datetime(2026, 1, 1, 12, 0))


def test_downtime_detected(desk):
    from flipbot.models import Heartbeat, utcnow
    from datetime import timedelta
    assert desk.beat() is None
    with desk.db.session() as s:
        s.get(Heartbeat, 1).last_beat_at = utcnow() - timedelta(hours=3)
    gap = desk.beat()
    assert gap and gap > timedelta(hours=2)


def test_backup_and_restore(tmp_path, cfg):
    from flipbot.db import Database
    from flipbot.models import Listing
    db = Database(str(tmp_path / "a.db"))
    from flipbot.paper.seed import seed
    with db.session() as s:
        seed(s, cfg)
    path = backup(FlipDesk(cfg, db), tmp_path / "backups")
    restored = Database(str(path))
    with restored.session() as s:
        assert s.query(Listing).count() == 16


def test_api_smoke(db, cfg):
    app = create_app(cfg, db, Secrets(None, frozenset(), None, None), background=False)
    c = TestClient(app)
    assert c.get("/").status_code == 200
    o = c.get("/api/overview").json()
    assert o["mode"] == "PAPER" and o["live_blockers"]
    deals = c.get("/api/deals").json()
    assert deals and deals[0]["deal_score"] >= deals[-1]["deal_score"]
    detail = c.get(f"/api/listings/{deals[0]['id']}").json()
    assert detail["negotiation"]["opening"] <= detail["negotiation"]["target"]
    assert c.post("/api/intake", json={"text": "nothing"}).status_code == 422
    r = c.post(f"/api/listings/{deals[0]['id']}/decision", json={"decision": "APPROVED"}).json()
    item_id = r["inventory"]["id"]
    assert c.post(f"/api/inventory/{item_id}/transition", json={"status": "PURCHASED"}).status_code == 409
    insp = c.post(f"/api/inventory/{item_id}/inspection").json()
    assert insp["items"]
    up = c.post("/api/price-rules", files={"file": ("r.csv", b"model,storage,max buy\niPhone 13,128,200\n")})
    assert up.json()["report"]["imported"] == 1
    assert c.get("/api/profit?days=365").json()
    assert c.get("/api/analytics").json()["models"]
    assert len(c.get("/api/connectors").json()) == 5
