from pathlib import Path

from fastapi.testclient import TestClient

from server.config import load_settings
from server.main import create_app

from .fakes import FakeMarkets


def client(tmp_path: Path, fake: FakeMarkets | None = None) -> TestClient:
    settings = load_settings(Path("does-not-exist.env"), overrides={"DB_PATH": str(tmp_path / "app.db")})
    app = create_app(settings, transport=(fake or FakeMarkets()).transport(), throttle=False)
    return TestClient(app, base_url="http://127.0.0.1")


def test_health(tmp_path):
    with client(tmp_path) as c:
        assert c.get("/api/health").json() == {"ok": True, "paper_only": True}


def test_rejects_requests_for_other_hostnames(tmp_path):
    with client(tmp_path) as c:
        response = c.get("/api/health", headers={"Host": "evil.example.com"})
        assert response.status_code == 400


def test_currency_setting_persists(tmp_path):
    with client(tmp_path) as c:
        assert c.get("/api/settings").json()["currency"] == "USD"
        assert c.put("/api/settings", json={"currency": "EUR"}).json()["currency"] == "EUR"
    with client(tmp_path) as c:
        assert c.get("/api/settings").json()["currency"] == "EUR"


def test_invalid_currency_rejected(tmp_path):
    with client(tmp_path) as c:
        assert c.put("/api/settings", json={"currency": "GBP"}).status_code == 422
        assert c.get("/api/assets/BTC/quote", params={"currency": "GBP"}).status_code == 422


def test_quote_and_candles(tmp_path):
    with client(tmp_path) as c:
        quote = c.get("/api/assets/BTC/quote", params={"currency": "USD"}).json()
        assert quote["price"]["value"] == 65000.0
        candles = c.get("/api/assets/BTC/candles", params={"currency": "EUR", "range": "1W"}).json()
        assert candles["source"]["pair"] == "BTC-EUR"


def test_unknown_coin_404(tmp_path):
    with client(tmp_path) as c:
        response = c.get("/api/assets/NOPE/quote")
        assert response.status_code == 404
        assert "NOPE" in response.json()["detail"]


def test_bad_symbol_rejected(tmp_path):
    with client(tmp_path) as c:
        assert c.get("/api/assets/..%2Fetc/quote").status_code in (404, 422)


def test_search_when_every_source_is_down(tmp_path):
    fake = FakeMarkets(coinbase_up=False, kraken_up=False)
    with client(tmp_path, fake) as c:
        response = c.get("/api/assets/search", params={"q": "btc"})
        assert response.status_code == 503
        assert {e["source"] for e in response.json()["errors"]} == {"coinbase", "kraken"}
