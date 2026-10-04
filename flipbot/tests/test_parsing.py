import pytest

from flipbot.engine.parsing import LIKELY, RED_FLAG, parse, parse_model, parse_storage


@pytest.mark.parametrize("text,model", [
    ("iPhone 13 128GB", "iPhone 13"),
    ("iphone13 128", "iPhone 13"),
    ("ιφον 13 pro max 256", "iPhone 13 Pro Max"),
    ("Αιφον 14 Pro μαύρο", "iPhone 14 Pro"),
    ("αϊφον 12 mini", "iPhone 12 mini"),
    ("iPhone 11 promax", "iPhone 11 Pro Max"),
    ("IPHONE 14+ 128", "iPhone 14 Plus"),
    ("iPhone 16e 128GB", "iPhone 16e"),
    ("Samsung Galaxy S23", None),
])
def test_model(text, model):
    assert parse_model(text) == model


@pytest.mark.parametrize("text,gb", [
    ("iPhone 13 128GB", 128), ("iphone 13 256 gb", 256), ("iPhone 15 Pro 1TB", 1024),
    ("iPhone 12 64", 64), ("iPhone 12", None),
])
def test_storage(text, gb):
    assert parse_storage(text) == gb


def test_greek_battery_condition_negotiable():
    p = parse("iPhone 13 128GB", "Σε άριστη κατάσταση, μπαταρία 88%. Τιμή συζητήσιμη.")
    assert p.battery_health.value == 88 and p.battery_health.certainty == LIKELY
    assert p.condition.value == "excellent"
    assert p.negotiable


def test_firm_price_not_negotiable():
    assert not parse("iPhone 13", "συζητήσιμη; όχι, τελική τιμή").negotiable


def test_structured_fields_are_verified():
    p = parse("iPhone", "", {"model": "iPhone 14", "storage_gb": 128, "battery_health": 90})
    assert p.model == "iPhone 14" and p.battery_health.certainty == "VERIFIED"


def test_hard_rejects_and_flags():
    p = parse("iPhone 13 Pro", "Κλειδωμένο σε iCloud, για ανταλλακτικά")
    codes = {c for c, _ in p.hard_rejects}
    assert {"icloud_lock", "for_parts"} <= codes
    assert parse("Αγοράζω iPhone 13", "").is_wanted_ad
    assert parse("iPhone 13", "μόνο ανταλλαγή").is_exchange_only
    assert parse("Θήκη iPhone 13", "").is_accessory
    assert not parse("iPhone 13 128GB με θήκη", "").is_accessory


def test_repairs_esim_faceid():
    p = parse("iPhone 14 128GB US model", "eSIM only. Μη γνήσια οθόνη. Face ID δεν λειτουργεί")
    assert p.sim_type.value == "esim_only_us" and p.sim_type.certainty == RED_FLAG
    assert "display" in p.repairs.value
    assert p.face_id.value == "broken"


def test_unknown_stays_unknown():
    p = parse("iphone 13 128", "")
    assert p.battery_health.value is None and p.battery_health.certainty == "UNKNOWN"
    assert p.condition.certainty == "UNKNOWN"
