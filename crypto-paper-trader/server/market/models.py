from dataclasses import dataclass, field
from datetime import datetime

SOURCE_NAMES = {
    "coinbase": "Coinbase Exchange",
    "kraken": "Kraken",
    "alpaca": "Alpaca",
    "ecb": "European Central Bank",
}


@dataclass
class Quote:
    base: str
    currency: str
    price: float | None
    source: str
    fetched_at: datetime
    observed_at: datetime | None
    pair: str
    bid: float | None = None
    ask: float | None = None
    open_24h: float | None = None
    high_24h: float | None = None
    low_24h: float | None = None
    volume_24h: float | None = None
    delay_seconds: int = 0

    @property
    def source_name(self) -> str:
        return SOURCE_NAMES.get(self.source, self.source)


@dataclass
class Candle:
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float | None


@dataclass
class CandleSeries:
    base: str
    currency: str
    pair: str
    source: str
    interval_seconds: int
    fetched_at: datetime
    candles: list[Candle] = field(default_factory=list)


@dataclass
class Notice:
    code: str
    level: str
    message: str

    def as_dict(self) -> dict:
        return {"code": self.code, "level": self.level, "message": self.message}


@dataclass
class FxRate:
    """How many units of `quote` one unit of `base` buys, e.g. EUR->USD 1.08."""

    base: str
    quote: str
    rate: float
    rate_date: str
    source: str
    fetched_at: datetime
