from pathlib import Path

import httpx
import pytest

from server.config import load_settings
from server.http import BlockedHostError, check_host
from server.main import create_app
from server.safety import SafetyError, find_problems

MISSING_ENV = Path("does-not-exist.env")


def settings(**env):
    return load_settings(MISSING_ENV, overrides={"DB_PATH": ":memory:", **env})


def test_clean_settings_pass():
    assert find_problems(settings()) == []


def test_paper_alpaca_key_is_allowed():
    assert find_problems(settings(ALPACA_API_KEY_ID="PKABC123", ALPACA_API_SECRET_KEY="x")) == []


def test_live_alpaca_key_is_refused():
    problems = find_problems(settings(ALPACA_API_KEY_ID="AKLIVE123"))
    assert any("LIVE-account key" in p for p in problems)


@pytest.mark.parametrize("name", ["COINBASE_API_SECRET", "KRAKEN_PRIVATE_KEY", "BINANCE_API_KEY"])
def test_exchange_account_keys_are_refused(name):
    assert any(name in p for p in find_problems(settings(**{name: "secret"})))


@pytest.mark.parametrize("url", [
    "https://api.alpaca.markets",
    "https://api.coinbase.com/api/v3/brokerage/orders",
    "https://api.kraken.com/0/private/AddOrder",
])
def test_live_trading_urls_are_refused(url):
    problems = find_problems(settings(SOME_URL=url))
    assert any("real-money" in p for p in problems)


def test_paper_alpaca_url_is_not_flagged():
    assert find_problems(settings(SOME_URL="https://paper-api.alpaca.markets")) == []


def test_non_local_host_is_refused():
    problems = find_problems(settings(HOST="0.0.0.0"))
    assert any("127.0.0.1" in p for p in problems)


def test_app_refuses_to_start_with_problems():
    with pytest.raises(SafetyError):
        create_app(settings(ALPACA_API_KEY_ID="AKLIVE123"))


@pytest.mark.parametrize("url", [
    "https://api.alpaca.markets/v2/orders",
    "https://paper-api.alpaca.markets/v2/orders",
    "https://api.coinbase.com/api/v3/brokerage/orders",
    "https://api.kraken.com/0/private/AddOrder",
    "https://example.com/prices",
])
def test_http_client_blocks_trading_and_unknown_hosts(url):
    with pytest.raises(BlockedHostError):
        check_host(httpx.URL(url))


@pytest.mark.parametrize("url", [
    "https://data.alpaca.markets/v1beta3/crypto/us/latest/trades",
    "https://api.exchange.coinbase.com/products",
    "https://api.kraken.com/0/public/Ticker",
    "https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A",
])
def test_http_client_allows_data_hosts(url):
    check_host(httpx.URL(url))
