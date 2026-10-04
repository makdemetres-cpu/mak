import io

import pytest
from openpyxl import Workbook

from flipbot.config import Config, live_blockers, setting
from flipbot.engine import location, pricerules, profit
from flipbot.engine.scoring import price_opportunity


def test_csv_import_report_and_versioning(db):
    csv = ("Μοντέλο;Χωρητικότητα;Τιμή αγοράς\n"
           "iPhone 13;128GB;€250\n"
           "iPhone 13;128;260\n"          # duplicate
           "Galaxy S23;128;300\n"         # unmatched
           "iPhone 12;;200\n"             # missing storage
           "iPhone 14 Pro 256GB;;€490,50\n")
    with db.session() as s:
        v1, rep = pricerules.import_rules(s, "rules.csv", csv.encode())
        assert rep.imported == 2
        assert rep.duplicates == ["iPhone 13 128GB"]
        assert rep.unmatched_models == ["Galaxy S23"]
        assert rep.missing_storage == ["iPhone 12"]
        assert pricerules.lookup(s, "iPhone 14 Pro", 256).max_buy_price == 490.5
        v2, _ = pricerules.import_rules(s, "rules2.csv", b"model,storage,max buy\niPhone 13,128,240\n")
        assert pricerules.active_version(s).id == v2.id and not v1.is_active  # history kept
        assert pricerules.lookup(s, "iPhone 13", 128).max_buy_price == 240


def test_xlsx_import(db):
    wb = Workbook()
    ws = wb.active
    ws.append(["Model", "Storage", "Max buy price", "Min battery"])
    ws.append(["iPhone 15 Pro", "256GB", 650, 85])
    buf = io.BytesIO()
    wb.save(buf)
    with db.session() as s:
        _, rep = pricerules.import_rules(s, "rules.xlsx", buf.getvalue())
        rule = pricerules.lookup(s, "iPhone 15 Pro", 256)
        assert rep.imported == 1 and rule.min_battery_health == 85


def test_import_needs_price_column(db):
    with db.session() as s, pytest.raises(ValueError):
        pricerules.import_rules(s, "x.csv", b"model,colour\niPhone 13,red\n")


def test_profit_math():
    cfg = Config.model_validate({"profit_rules": {"repair_reserve_eur": 10, "travel_cost_per_km": 0.5,
                                                  "time_value_eur_per_hour": 0},
                                 "fees": {"vendora": {"sell_fee_pct": 5, "withdrawal_fee": 1, "shipping_eur": 0}}})
    pb = profit.estimate(cfg, expected_sale=300, purchase_price=200, travel_minutes=30, distance_km=20)
    # 300 - 200 - 10 - 15 (5%) - 1 - 0 - 20 (2×20km×0.5)
    assert pb.net_profit == pytest.approx(54)
    assert pb.roi_percent == pytest.approx(54 / 230 * 100)
    shipped = profit.estimate(cfg, 300, 200, travel_minutes=30, delivery="shipped")
    assert shipped.travel_cost == 0


def test_live_mode_never_uses_placeholders():
    live = Config(mode="LIVE")
    assert setting(live, "deal_rules.minimum_profit_eur") is None
    assert setting(Config(), "deal_rules.minimum_profit_eur") is not None
    blockers = live_blockers(live, has_price_rules=False)
    assert "deal_rules.minimum_profit_eur" in blockers
    assert any("spreadsheet" in b for b in blockers)
    with pytest.raises(ValueError):
        profit.estimate(live, 300, 200, None)  # fees unset → refuses to guess


def test_weights_must_sum_to_100():
    with pytest.raises(ValueError):
        Config.model_validate({"deal_score_weights": {"price_opportunity": 50}})


def test_location_tiers_closer_is_better():
    cfg = Config().location
    s5, s10, s25, s38, s55 = (location.score_location(m, cfg) for m in (5, 10, 25, 38, 55))
    assert not any(v.excluded for v in (s5, s10, s25, s38, s55))  # 10 min is NOT rejected
    assert s5.score == s10.score == 1.0
    assert s10.score > s25.score > s38.score > s55.score > 0
    assert location.score_location(72, cfg).excluded
    over = location.score_location(72, cfg, expected_profit=150, override_min_profit=90)
    assert not over.excluded and over.override_applied
    assert location.score_location(None, cfg, delivery="shipped").tier == location.SHIPPED


def test_price_opportunity_negotiation_band():
    below, _ = price_opportunity(225, 250, False, 25)
    at, _ = price_opportunity(250, 250, False, 25)
    above, _ = price_opportunity(265, 250, True, 25)
    assert below == 1.0 and at == 0.5 and 0 < above < at
