from datetime import timedelta

import pytest

from flipbot.connectors.base import RawListing
from flipbot.engine import pipeline
from flipbot.models import Listing, utcnow
from flipbot.paper.seed import scenarios, seed


def raw(**kw):
    base = dict(marketplace="vendora", title="iPhone 13 128GB Midnight",
                description="Πολύ καλή κατάσταση, μπαταρία 88%, όλα γνήσια, με κουτί. Face ID δουλεύει.",
                price=235, location="Rafina", travel_minutes=18, location_confidence="HIGH",
                seller_id="s1", seller_rating=4.9, seller_account_age_days=500,
                image_urls=["a", "b", "c"], image_hashes=["h1", "h2", "h3"], external_id="x1")
    base.update(kw)
    return RawListing(**base)


def test_good_deal_is_hot_with_explanation(seeded, cfg):
    with seeded.session() as s:
        r = pipeline.ingest(s, cfg, raw())
        x = r.listing
        assert x.tier == "HOT" and x.risk_level == "LOW" and r.should_alert
        comps = x.evaluation["components"]
        assert sum(c["points"] for c in comps) == pytest.approx(x.deal_score, abs=0.2)
        assert all(c["reason"] for c in comps)
        assert x.my_max_buy == 250 and x.expected_sale < x.evaluation["valuation"]["high"]


def test_ten_minutes_is_not_rejected_and_beats_55(seeded, cfg):
    with seeded.session() as s:
        near = pipeline.ingest(s, cfg, raw(external_id="n", travel_minutes=10, image_hashes=["n"])).listing
        far = pipeline.ingest(s, cfg, raw(external_id="f", travel_minutes=55, seller_id="s2",
                                          image_hashes=["f"])).listing
        assert near.tier != "REJECTED" and far.tier != "REJECTED"
        loc = lambda x: next(c for c in x.evaluation["components"] if c["key"] == "location")["points"]  # noqa: E731
        assert loc(near) > loc(far)
        assert near.net_profit > far.net_profit  # travel cost counts


def test_beyond_hard_max_rejected(seeded, cfg):
    with seeded.session() as s:
        x = pipeline.ingest(s, cfg, raw(travel_minutes=75)).listing
        assert x.tier == "REJECTED" and any("hard max" in r for r in x.evaluation["rejects"])


def test_negotiation_band(seeded, cfg):
    with seeded.session() as s:
        within = pipeline.ingest(s, cfg, raw(external_id="a", price=265, image_hashes=["a"],
                                             description=raw().description + " Τιμή συζητήσιμη")).listing
        outside = pipeline.ingest(s, cfg, raw(external_id="b", price=300, seller_id="s9",
                                              image_hashes=["b"])).listing
        assert within.tier == "NEGOTIATE"
        assert outside.tier == "REJECTED"


def test_high_risk_never_hot(seeded, cfg):
    with seeded.session() as s:
        x = pipeline.ingest(s, cfg, raw(description="Σφραγισμένο, θέλω προκαταβολή, μόνο αποστολή",
                                        price=150, seller_account_age_days=2)).listing
        assert x.risk_level == "HIGH" and x.tier not in ("HOT", "GOOD")


def test_dedup_and_price_drop_realert(seeded, cfg):
    with seeded.session() as s:
        first = pipeline.ingest(s, cfg, raw())
        pipeline.mark_alerted(first.listing)
        again = pipeline.ingest(s, cfg, raw())
        assert not again.is_new and not again.should_alert
        small = pipeline.ingest(s, cfg, raw(price=230))
        assert not small.should_alert  # €5 < re-alert threshold
        drop = pipeline.ingest(s, cfg, raw(price=220))
        assert drop.should_alert and "price drop" in drop.alert_reason
        assert len(drop.listing.snapshots) == 3  # history kept


def test_vendora_facebook_mirror_linked(seeded, cfg):
    with seeded.session() as s:
        v = pipeline.ingest(s, cfg, raw(image_hashes=["m1", "m2"]))
        fb = pipeline.ingest(s, cfg, raw(marketplace="facebook", external_id="fb1", seller_id=None,
                                         image_hashes=["m1", "m2"]))
        assert fb.duplicate_of.id == v.listing.id and not fb.should_alert
        assert fb.listing.risk_level == "LOW"  # a mirror is not a reused photo


def test_rules_from_settings_reject(seeded, cfg):
    cfg.risk.allow_esim_only_us_models = False
    with seeded.session() as s:
        x = pipeline.ingest(s, cfg, raw(title="iPhone 13 128GB US model eSIM only")).listing
        assert x.tier == "REJECTED"


def test_paper_seed_covers_scenarios(db, cfg):
    with db.session() as s:
        seed(s, cfg)
        by = {x.external_id: x for x in s.query(Listing)}
        assert by["paper-excellent"].tier == "HOT"
        assert by["paper-very-close"].tier in ("HOT", "GOOD")
        assert by["paper-negotiable"].tier == "NEGOTIATE"
        assert by["paper-overpriced"].tier == "REJECTED"
        assert by["paper-scam"].risk_level == "HIGH"
        assert by["paper-too-far"].tier == "REJECTED"
        assert by["paper-exceptional-55"].tier in ("HOT", "GOOD")
        assert by["paper-fb-mirror"].duplicate_of_id == by["paper-vendora-src"].id
        assert by["paper-icloud"].tier == "REJECTED" and by["paper-wanted"].tier == "REJECTED"
        assert by["paper-skoop-shipped"].delivery == "shipped"
        assert all(x.is_paper for x in by.values())
        assert seed(s, cfg) == {"seeded": False}  # idempotent
