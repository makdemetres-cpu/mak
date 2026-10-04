"""Deterministic listing parser (English + Greek, incl. common misspellings).

AI is only meant for listings this cannot resolve (`needs_ai` is set then).
Every extracted fact carries a certainty: VERIFIED, LIKELY, UNKNOWN or RED FLAG.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

VERIFIED, LIKELY, UNKNOWN, RED_FLAG = "VERIFIED", "LIKELY", "UNKNOWN", "RED FLAG"


def fold(text: str) -> str:
    """Lower-case, strip Greek/Latin accents, normalise iPhone spellings."""
    text = unicodedata.normalize("NFD", text or "")
    text = "".join(c for c in text if unicodedata.category(c) != "Mn").lower()
    text = text.replace("ς", "σ")
    for variant in ("αιφον", "αϊφον", "ιφον", "ιφωνε", "αιφων", "i phone", "iphome", "ipone", "iphon "):
        text = text.replace(variant, "iphone ")
    text = re.sub(r"iphone(?=\d)", "iphone ", text)
    text = text.replace("promax", "pro max").replace("προ μαξ", "pro max").replace("πρo", "pro")
    return re.sub(r"\s+", " ", text)


_MODEL_RE = re.compile(
    r"iphone\s*(1[1-7])\s*(e\b)?\s*(pro\s*max|pro|plus|mini|\+)?", re.IGNORECASE)
_STORAGE_RE = re.compile(r"\b(64|128|256|512)\s*(?:gb|g\b|gigabytes?|γκ|γιγα)|\b(1)\s*tb\b")
_STORAGE_BARE_RE = re.compile(r"\b(64|128|256|512)\b")
_BATTERY_RE = re.compile(
    r"(?:battery(?: health)?|bh|μπαταρια|υγεια μπαταριασ|μπαταρια στο|health)\D{0,18}?(\d{2,3})\s*%"
    r"|(\d{2,3})\s*%\s*(?:battery|bh|μπαταρια|υγεια)")
_CYCLES_RE = re.compile(r"(\d{1,4})\s*(?:cycles|κυκλουσ|κυκλοι)")

_CONDITION_WORDS = [
    ("like_new", ["σαν καινουριο", "σαν καινουργιο", "like new", "αψογο", "mint", "σφραγισμενο"]),
    ("excellent", ["αριστη", "αριστο", "excellent", "αψογη"]),
    ("very_good", ["πολυ καλη", "πολυ καλο", "very good"]),
    ("good", ["καλη κατασταση", "good condition", "καλο"]),
    ("fair", ["γρατζουνιεσ", "γρατσουνιεσ", "scratches", "σημαδια", "χτυπηματα"]),
    ("damaged", ["ραγισμεν", "σπασμεν", "cracked", "broken screen", "σπασιμο"]),
]

_REJECT_RULES = [
    ("icloud_lock", ["icloud", "activation lock", "κλειδωμενο", "κλειδωμενη", "locked to owner"],
     "Seller mentions iCloud / Activation Lock"),
    ("for_parts", ["για ανταλλακτικα", "for parts", "ανταλλακτικα μονο", "parts only"],
     "Sold for parts"),
    ("motherboard", ["μητρικη", "motherboard", "logic board", "δεν ανοιγει", "doesn't turn on",
                     "does not turn on"], "Motherboard fault / does not power on"),
    ("water", ["βρεγμεν", "βραχηκε", "water damage", "επαφη με νερο"], "Water damage"),
    ("stolen", ["found phone", "βρεθηκε στο δρομο", "χωρισ κωδικο κλειδωματοσ"],
     "Possible stolen goods"),
]
_FACE_ID_BROKEN = ["face id δεν", "χωρισ face id", "faceid δεν", "face id not working",
                   "no face id", "face id χαλασμεν", "face id broken"]
_WANTED = ["αγοραζω", "ζητειται", "ζητω", "wanted", "looking for", "buying"]
_EXCHANGE_ONLY = ["ανταλλαγη μονο", "μονο ανταλλαγη", "exchange only", "trade only"]
_ACCESSORY_TITLE = ["θηκη", "case", "τζαμακι", "screen protector", "προστατευτικο", "καλωδιο",
                    "φορτιστησ", "magsafe wallet"]
_REPAIRS = [
    ("display", ["μη γνησια οθονη", "αλλαγμενη οθονη", "αλλαγη οθονησ", "replaced screen",
                 "aftermarket screen", "νεα οθονη", "non genuine display", "unknown part"]),
    ("battery", ["αλλαγμενη μπαταρια", "αλλαγη μπαταριασ", "replaced battery", "new battery",
                 "καινουρια μπαταρια", "καινουργια μπαταρια"]),
    ("camera", ["αλλαγμενη καμερα", "replaced camera"]),
]
_NEGOTIABLE = ["συζητησιμη", "συζητησιμο", "negotiable", "obo", "λιγο συζητησιμη"]
_FIRM = ["τελικη τιμη", "οχι παζαρι", "firm", "χωρισ παζαρι"]
_ESIM_US = ["esim only", "μονο esim", "us model", "usa model", "αμερικανικο", "αμερικησ",
            "χωρισ θεση sim", "no sim tray"]
_BOX = ["κουτι", "box", "συσκευασια"]
_CHARGER = ["φορτιστη", "φορτιστησ", "charger", "καλωδιο"]
_WARRANTY = ["εγγυηση", "warranty", "applecare"]
_COLORS = {
    "black": ["black", "μαυρο", "midnight", "space gray", "space grey", "graphite"],
    "white": ["white", "ασπρο", "λευκο", "starlight", "silver", "ασημι"],
    "blue": ["blue", "μπλε", "pacific blue", "sierra blue", "sky blue"],
    "red": ["red", "κοκκινο", "product red"],
    "purple": ["purple", "μωβ", "deep purple"],
    "gold": ["gold", "χρυσο"],
    "green": ["green", "πρασινο", "alpine green"],
    "pink": ["pink", "ροζ"],
    "natural titanium": ["natural titanium", "titanium", "τιτανιο"],
}


@dataclass
class Fact:
    value: object
    certainty: str


@dataclass
class ParsedListing:
    model: str | None = None
    storage_gb: int | None = None
    color: str | None = None
    battery_health: Fact = field(default_factory=lambda: Fact(None, UNKNOWN))
    battery_cycles: int | None = None
    condition: Fact = field(default_factory=lambda: Fact(None, UNKNOWN))
    face_id: Fact = field(default_factory=lambda: Fact(None, UNKNOWN))
    repairs: Fact = field(default_factory=lambda: Fact(None, UNKNOWN))
    sim_type: Fact = field(default_factory=lambda: Fact(None, UNKNOWN))
    negotiable: bool = False
    has_box: bool = False
    has_charger: bool = False
    warranty_mentioned: bool = False
    hard_rejects: list[tuple[str, str]] = field(default_factory=list)
    is_wanted_ad: bool = False
    is_exchange_only: bool = False
    is_accessory: bool = False
    needs_ai: bool = False


def _any(text: str, words: list[str]) -> bool:
    return any(w in text for w in words)


def parse_model(text: str) -> str | None:
    m = _MODEL_RE.search(fold(text))
    if not m:
        return None
    number, e_suffix, variant = m.group(1), m.group(2), (m.group(3) or "").strip()
    name = f"iPhone {number}"
    if e_suffix:
        return name + "e"
    variant = re.sub(r"\s+", " ", variant)
    if variant == "+":
        variant = "plus"
    if variant:
        name += " " + {"pro max": "Pro Max", "pro": "Pro", "plus": "Plus", "mini": "mini"}[variant]
    return name


def parse_storage(text: str) -> int | None:
    t = fold(text)
    m = _STORAGE_RE.search(t)
    if m:
        return 1024 if m.group(2) else int(m.group(1))
    m = _STORAGE_BARE_RE.search(t)
    return int(m.group(1)) if m else None


def parse(title: str, description: str = "", structured: dict | None = None) -> ParsedListing:
    """Parse a listing. `structured` holds marketplace-provided fields (VERIFIED-level)."""
    structured = structured or {}
    title_f, text = fold(title), fold(f"{title} \n {description}")
    p = ParsedListing()

    p.model = structured.get("model") or parse_model(text)
    p.storage_gb = structured.get("storage_gb") or parse_storage(text)
    for color, words in _COLORS.items():
        if _any(text, words):
            p.color = color
            break

    if structured.get("battery_health") is not None:
        p.battery_health = Fact(int(structured["battery_health"]), VERIFIED)
    else:
        m = _BATTERY_RE.search(text)
        if m:
            value = int(m.group(1) or m.group(2))
            if 50 <= value <= 100:
                p.battery_health = Fact(value, LIKELY)
    m = _CYCLES_RE.search(text)
    if m:
        p.battery_cycles = int(m.group(1))

    for label, words in _CONDITION_WORDS:
        if _any(text, words):
            p.condition = Fact(label, RED_FLAG if label == "damaged" else LIKELY)
            break
    if structured.get("condition"):
        p.condition = Fact(structured["condition"], VERIFIED)

    if _any(text, _FACE_ID_BROKEN):
        p.face_id = Fact("broken", RED_FLAG)
    elif re.search(r"face ?id\s*(?:δουλευει|λειτουργει|works|ok|τελεια)", text):
        p.face_id = Fact("working", LIKELY)

    repairs = [part for part, words in _REPAIRS if _any(text, words)]
    if repairs:
        p.repairs = Fact(repairs, RED_FLAG)
    elif re.search(r"(?:δεν εχει|ποτε δεν|never|no)\s*(?:ανοιχτει|ανοιξει|repairs?|επισκευ)", text) \
            or _any(text, ["ολα γνησια", "all original", "all genuine"]):
        p.repairs = Fact([], LIKELY)

    if _any(text, _ESIM_US):
        p.sim_type = Fact("esim_only_us", RED_FLAG)
    elif _any(text, ["dual sim", "θεση sim", "physical sim", "κανονικη sim"]):
        p.sim_type = Fact("physical", LIKELY)

    p.negotiable = _any(text, _NEGOTIABLE) and not _any(text, _FIRM)
    p.has_box = _any(text, _BOX)
    p.has_charger = _any(text, _CHARGER)
    p.warranty_mentioned = _any(text, _WARRANTY)

    for code, words, reason in _REJECT_RULES:
        if _any(text, words):
            p.hard_rejects.append((code, reason))
    if p.face_id.value == "broken":
        p.hard_rejects.append(("face_id_broken", "Face ID broken"))
    p.is_wanted_ad = _any(title_f, _WANTED)
    p.is_exchange_only = _any(text, _EXCHANGE_ONLY)
    p.is_accessory = _any(title_f, _ACCESSORY_TITLE) and parse_storage(title_f) is None

    p.needs_ai = p.model is None or p.storage_gb is None
    return p
