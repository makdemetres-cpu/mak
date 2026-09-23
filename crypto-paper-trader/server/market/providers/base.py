import re
from datetime import datetime, timezone

import httpx

from ...http import BlockedHostError
from ..models import SOURCE_NAMES


class ProviderError(Exception):
    """kind is one of: network, rate_limited, not_listed, bad_data, http, blocked."""

    def __init__(self, source: str, kind: str, message: str):
        self.source = source
        self.kind = kind
        super().__init__(message)

    @property
    def source_name(self) -> str:
        return SOURCE_NAMES.get(self.source, self.source)


_FRACTION = re.compile(r"(\.\d{6})\d+")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    text = _FRACTION.sub(r"\1", value.strip()).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def to_float(value) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


async def get_json(client: httpx.AsyncClient, source: str, url: str, **kwargs):
    name = SOURCE_NAMES.get(source, source)
    try:
        response = await client.get(url, **kwargs)
    except BlockedHostError as exc:
        raise ProviderError(source, "blocked", str(exc)) from exc
    except httpx.TimeoutException as exc:
        raise ProviderError(source, "network", f"{name} took too long to answer.") from exc
    except httpx.TransportError as exc:
        raise ProviderError(source, "network", f"Couldn't reach {name}. Check your internet connection.") from exc

    if response.status_code == 429:
        raise ProviderError(source, "rate_limited", f"{name} asked us to slow down (rate limit). We'll retry shortly.")
    if response.status_code == 404:
        raise ProviderError(source, "not_listed", f"{name} doesn't have this market.")
    if response.status_code >= 400:
        raise ProviderError(source, "http", f"{name} returned an error (HTTP {response.status_code}).")
    try:
        return response.json()
    except ValueError as exc:
        raise ProviderError(source, "bad_data", f"{name} sent a reply we couldn't read.") from exc
