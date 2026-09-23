from datetime import datetime, timezone

import httpx

from ..models import Quote
from .base import ProviderError, get_json, parse_iso, to_float

# Market data only. The app has no code path to Alpaca's trading hosts, and
# server/http.py refuses them even if one were added by mistake.
DATA_URL = "https://data.alpaca.markets/v1beta3/crypto/us"
SOURCE = "alpaca"


class AlpacaProvider:
    source = SOURCE

    def __init__(self, client: httpx.AsyncClient, key_id: str = "", secret: str = "", clock=lambda: datetime.now(timezone.utc)):
        self.client = client
        self.clock = clock
        self.headers = {"APCA-API-KEY-ID": key_id, "APCA-API-SECRET-KEY": secret} if key_id and secret else {}

    async def quote(self, base: str, currency: str, pair: str) -> Quote:
        data = await get_json(
            self.client, SOURCE, f"{DATA_URL}/latest/trades", params={"symbols": pair}, headers=self.headers
        )
        trade = ((data or {}).get("trades") or {}).get(pair)
        if not trade:
            raise ProviderError(SOURCE, "not_listed", "Alpaca doesn't have this market.")
        return Quote(
            base=base,
            currency=currency,
            price=to_float(trade.get("p")),
            source=SOURCE,
            fetched_at=self.clock(),
            observed_at=parse_iso(trade.get("t")),
            pair=pair,
        )
