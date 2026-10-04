"""Marketplace connectors.

Until the feasibility review (docs/FEASIBILITY.md) is completed and approved,
no real marketplace connector makes network requests. Each one says so in the
UI. Discovery on every platform works today through Manual Intake.
"""

from __future__ import annotations

import re

from .base import ASSISTED, PENDING, Capabilities, MarketplaceConnector, RawListing
from ..engine.parsing import fold

_PENDING_REASON = "Feasibility review pending — ToS / API not yet verified"


class _PendingConnector(MarketplaceConnector):
    expected_note = ""

    def capabilities(self) -> Capabilities:
        return Capabilities(
            discovery=f"{ASSISTED} (share-to-bot)", publishing=f"{ASSISTED} (copy & paste)",
            operations={"search": PENDING, "fetch": PENDING, "publish": PENDING,
                        "update": PENDING, "mark_sold": ASSISTED},
            reason=f"{_PENDING_REASON}. {self.expected_note}".strip())

    def health_check(self) -> tuple[str, str]:
        return "DISABLED", "Automated scanning off until the feasibility review is approved"


class VendoraConnector(_PendingConnector):
    name, display_name = "vendora", "Vendora"
    expected_note = "Listings also appear on Facebook Marketplace (GR/CY/BG) via Vendora's Meta partnership."


class FacebookMarketplaceConnector(_PendingConnector):
    name, display_name = "facebook", "Facebook Marketplace"
    expected_note = "Expected to stay ASSISTED: automated access is likely prohibited."


class VintedConnector(_PendingConnector):
    name, display_name = "vinted", "Vinted"
    sells_shipped_only = True
    expected_note = "Expected to stay ASSISTED: strict ToS. Shipped purchases only."


class SkoopConnector(_PendingConnector):
    name, display_name = "skoop", "Skoop by Skroutz"
    sells_shipped_only = True
    expected_note = "Shipping-only; 2-day return window after delivery; KYC is never automated."


_DOMAINS = {"vendora": "vendora", "facebook.com": "facebook", "fb.com": "facebook",
            "vinted": "vinted", "skroutz": "skoop", "skoop": "skoop"}
_PRICE_RE = re.compile(r"(?:€\s*(\d{2,4}(?:[.,]\d{1,2})?)|(\d{2,4}(?:[.,]\d{1,2})?)\s*(?:€|ευρω|eur\b|euro))")
_URL_RE = re.compile(r"https?://\S+")

# Attica localities for matching free text to a place (names only — drive
# times come from the routing cache, never from this list).
ATTICA_LOCALITIES = {
    "αρτεμιδα": "Artemida", "artemida": "Artemida", "λουτσα": "Artemida",
    "ραφηνα": "Rafina", "rafina": "Rafina", "σπατα": "Spata", "spata": "Spata",
    "μαρκοπουλο": "Markopoulo", "markopoulo": "Markopoulo", "κορωπι": "Koropi", "koropi": "Koropi",
    "παιανια": "Paiania", "παλληνη": "Pallini", "pallini": "Pallini", "γερακασ": "Gerakas",
    "gerakas": "Gerakas", "αγια παρασκευη": "Agia Paraskevi", "agia paraskevi": "Agia Paraskevi",
    "χαλανδρι": "Chalandri", "chalandri": "Chalandri", "μαρουσι": "Marousi", "marousi": "Marousi",
    "κηφισια": "Kifisia", "kifisia": "Kifisia", "βουλα": "Voula", "voula": "Voula",
    "γλυφαδα": "Glyfada", "glyfada": "Glyfada", "βαρη": "Vari", "κερατεα": "Keratea",
    "πειραιασ": "Piraeus", "piraeus": "Piraeus", "πειραια": "Piraeus",
    "αθηνα": "Athens", "athens": "Athens", "κεντρο": "Athens", "νεα σμυρνη": "Nea Smyrni",
    "καλλιθεα": "Kallithea", "περιστερι": "Peristeri", "νεα μακρη": "Nea Makri",
    "μαραθωνασ": "Marathonas", "πορτο ραφτη": "Porto Rafti", "λαυριο": "Lavrio",
    "αχαρνεσ": "Acharnes", "μενιδι": "Acharnes", "ελευσινα": "Elefsina",
}


def detect_marketplace(text: str) -> str:
    for url in _URL_RE.findall(text):
        for domain, name in _DOMAINS.items():
            if domain in url.lower():
                return name
    return "manual"


def detect_locality(text: str) -> str | None:
    folded = fold(text)
    for key in sorted(ATTICA_LOCALITIES, key=len, reverse=True):
        if re.search(rf"(?<!\w){re.escape(key)}", folded):
            return ATTICA_LOCALITIES[key]
    return None


class ManualIntakeConnector(MarketplaceConnector):
    """Share-to-bot: a URL, pasted text or (later) a screenshot. Works on every platform.

    A shared URL is NOT fetched while the feasibility review is pending — the
    listing is built from the text the owner pasted.
    """
    name, display_name = "manual", "Manual intake"

    def capabilities(self) -> Capabilities:
        return Capabilities(discovery=ASSISTED, publishing=ASSISTED,
                            operations={"search": ASSISTED, "fetch": ASSISTED, "publish": ASSISTED,
                                        "update": ASSISTED, "mark_sold": ASSISTED},
                            reason="Owner shares the listing; works on every platform")

    def health_check(self) -> tuple[str, str]:
        return "ONLINE", "Ready — share a listing in Telegram or the dashboard"

    def from_text(self, text: str, travel_lookup=None) -> RawListing:
        urls = _URL_RE.findall(text)
        body = _URL_RE.sub("", text).strip()
        lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
        title = lines[0][:200] if lines else "Shared listing"
        m = _PRICE_RE.search(body.replace(" ", " "))
        if not m:
            raise ValueError("Couldn't find a price (e.g. €240) in the shared text")
        price = float((m.group(1) or m.group(2)).replace(",", "."))
        locality = detect_locality(body)
        minutes = travel_lookup(locality) if (travel_lookup and locality) else None
        marketplace = detect_marketplace(text)
        delivery = "shipped" if marketplace in ("vinted", "skoop") else "pickup"
        return RawListing(
            marketplace=marketplace, title=title, price=price,
            description="\n".join(lines[1:]), url=urls[0] if urls else None,
            location=locality, travel_minutes=minutes,
            location_confidence="MEDIUM" if minutes is not None else "LOW",
            delivery=delivery, source="intake")


def all_connectors() -> list[MarketplaceConnector]:
    return [VendoraConnector(), FacebookMarketplaceConnector(), VintedConnector(),
            SkoopConnector(), ManualIntakeConnector()]
