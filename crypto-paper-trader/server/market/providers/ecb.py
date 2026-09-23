import csv
import io
from datetime import date, datetime, timezone

import httpx

from ...http import BlockedHostError
from ..models import FxRate
from .base import ProviderError

# D.USD.EUR.SP00.A is the ECB's daily euro reference rate, quoted as US dollars per 1 euro.
SERIES_URL = "https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A"
SOURCE = "ecb"


class EcbProvider:
    source = SOURCE

    def __init__(self, client: httpx.AsyncClient, clock=lambda: datetime.now(timezone.utc)):
        self.client = client
        self.clock = clock

    async def _rows(self, params: dict) -> list[tuple[str, float]]:
        try:
            response = await self.client.get(
                SERIES_URL, params={"format": "csvdata", **params}, headers={"Accept": "text/csv"}
            )
        except BlockedHostError as exc:
            raise ProviderError(SOURCE, "blocked", str(exc)) from exc
        except httpx.TransportError as exc:
            raise ProviderError(SOURCE, "network", "Couldn't reach the European Central Bank.") from exc
        if response.status_code == 404:
            raise ProviderError(SOURCE, "bad_data", "The European Central Bank has no rates for those dates.")
        if response.status_code >= 400:
            raise ProviderError(SOURCE, "http", f"The European Central Bank returned an error (HTTP {response.status_code}).")

        rows: list[tuple[str, float]] = []
        for row in csv.DictReader(io.StringIO(response.text)):
            period, value = row.get("TIME_PERIOD"), row.get("OBS_VALUE")
            try:
                rate = float(value) if value else None
            except ValueError:
                rate = None
            if period and rate and rate > 0:
                rows.append((period, rate))
        if not rows:
            raise ProviderError(SOURCE, "bad_data", "The European Central Bank sent no usable rates.")
        return sorted(rows)

    async def latest(self) -> FxRate:
        period, rate = (await self._rows({"lastNObservations": 1}))[-1]
        return FxRate("EUR", "USD", rate, period, SOURCE, self.clock())

    async def history(self, start: date, end: date) -> list[FxRate]:
        fetched = self.clock()
        rows = await self._rows({"startPeriod": start.isoformat(), "endPeriod": end.isoformat()})
        return [FxRate("EUR", "USD", rate, period, SOURCE, fetched) for period, rate in rows]
