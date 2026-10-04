"""Negotiation assistant: numbers + polite Greek drafts. Never sent automatically."""

from __future__ import annotations

import math

from ..config import Config, setting
from ..models import Listing


def _down5(x: float) -> int:
    return int(math.floor(x / 5) * 5)


def plan(cfg: Config, listing: Listing) -> dict:
    buffer_pct = float(setting(cfg, "profit_rules.negotiation_buffer_percent") or 0)
    band = float(setting(cfg, "profit_rules.negotiation_band_eur") or 0)
    max_buy = listing.my_max_buy or listing.price
    absolute = min(listing.price, max_buy + (band if listing.price > max_buy else 0))
    target = min(absolute, _down5(listing.price * (1 - buffer_pct / 100)))
    opening = min(target, _down5(target * 0.94))
    return {"listing_price": listing.price, "my_max": max_buy, "opening": opening,
            "target": target, "absolute_max": absolute}


def drafts(cfg: Config, listing: Listing) -> dict[str, str]:
    p = plan(cfg, listing)
    model = listing.model or "iPhone"
    if listing.delivery == "shipped":
        first = (f"Καλησπέρα! Ενδιαφέρομαι για το {model}. Θα το αγόραζα άμεσα μέσω της πλατφόρμας "
                 f"στα €{p['opening']}, αν είναι εντάξει για εσάς.")
    else:
        first = (f"Καλησπέρα! Ενδιαφέρομαι για το {model}. Αν είναι όπως στην αγγελία και μπορώ να το "
                 f"ελέγξω από κοντά, μπορώ να έρθω άμεσα και να το πάρω στα €{p['opening']}.")
    return {
        "opening": first,
        "counter": (f"Σας ευχαριστώ για την απάντηση! Μπορώ να φτάσω μέχρι €{p['target']}, "
                    f"με πληρωμή τοις μετρητοίς ή IRIS τη στιγμή της παράδοσης."),
        "checks": ("Πριν την πληρωμή θα ήθελα να δω ότι το Εύρεση (Find My) είναι απενεργοποιημένο, "
                   "να γίνει διαγραφή όλου του περιεχομένου μπροστά μου, και να δω το Ιστορικό "
                   "ανταλλακτικών και σέρβις στις Ρυθμίσεις. Είναι εντάξει;"),
        "battery": "Θα μπορούσατε να μου στείλετε screenshot από την Υγεία μπαταρίας;",
    }
