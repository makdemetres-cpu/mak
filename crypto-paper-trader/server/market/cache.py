from datetime import datetime
from typing import Any, Callable, Hashable


class TimedCache:
    """Remembers when each value was stored so callers can say how old it is."""

    def __init__(self, clock: Callable[[], datetime]):
        self.clock = clock
        self._items: dict[Hashable, tuple[Any, datetime]] = {}

    def put(self, key: Hashable, value: Any) -> None:
        self._items[key] = (value, self.clock())

    def fresh(self, key: Hashable, ttl_seconds: float) -> Any | None:
        item = self._items.get(key)
        if item is None:
            return None
        value, stored_at = item
        if (self.clock() - stored_at).total_seconds() > ttl_seconds:
            return None
        return value

    def last(self, key: Hashable) -> tuple[Any, datetime] | None:
        return self._items.get(key)
