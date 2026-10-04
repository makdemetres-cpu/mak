"""Risk Score — separate from the Deal Score and used as a gate, never averaged in."""

from __future__ import annotations

from dataclasses import dataclass, field

from .parsing import fold, parse_model

_PAY_FIRST = ["προκαταβολη", "deposit", "πληρωμη πρωτα", "pay first", "στειλε τα χρηματα",
              "πληρωμη μεσω link", "payment link", "κρατηση με", "western union", "paysafe"]
_OFF_PLATFORM = ["viber", "whatsapp", "telegram", "στειλε μηνυμα στο", "εκτοσ πλατφορμασ",
                 "off platform", "email me"]
_NO_MEET = ["δεν μπορω να συναντηθω", "μονο αποστολη", "δεν γινεται συναντηση", "no meetups",
            "shipping only", "βρισκομαι στο εξωτερικο", "i am abroad"]
_NO_TEST = ["χωρισ δοκιμη", "no testing", "δεν δοκιμαζεται", "οπωσ ειναι"]
_SEALED = ["σφραγισμενο", "sealed", "καινουριο στο κουτι", "brand new"]


@dataclass
class RiskResult:
    level: str                       # LOW MEDIUM HIGH
    points: int
    reasons: list[str] = field(default_factory=list)


def assess(title: str, description: str, price: float, market_typical: float | None,
           delivery: str, photos: int, seller_account_age_days: int | None,
           seller_rating: float | None, reused_photo: bool, mentions_lock: bool) -> RiskResult:
    text = fold(f"{title} {description}")
    pts, reasons = 0, []

    def flag(n: int, why: str) -> None:
        nonlocal pts
        pts += n
        reasons.append(why)

    if market_typical:
        ratio = price / market_typical
        if any(w in text for w in _SEALED) and ratio < 0.75:
            flag(3, f"'Sealed/new' at {ratio:.0%} of market — impossible price")
        elif ratio < 0.5:
            flag(3, f"Price is {ratio:.0%} of market — far too low")
        elif ratio < 0.6:
            flag(1, f"Price is {ratio:.0%} of market — unusually low")
    if seller_account_age_days is not None and seller_account_age_days < 30:
        flag(1, f"Seller account is {seller_account_age_days} days old")
    if seller_rating is not None and seller_rating < 4.0:
        flag(1, f"Seller rating {seller_rating:.1f}")
    title_model, desc_model = parse_model(title), parse_model(description)
    if title_model and desc_model and title_model != desc_model:
        flag(1, f"Inconsistent model: title says {title_model}, description {desc_model}")
    if photos == 0:
        flag(1, "No photos")
    if reused_photo:
        flag(2, "Photo matches another seller's listing (stock or reused)")
    if any(w in text for w in _PAY_FIRST):
        flag(3, "Asks for payment/deposit before meeting")
    if delivery == "shipped" and any(w in text for w in _OFF_PLATFORM):
        flag(2, "Wants to move off-platform for a shipped deal")
    if delivery == "pickup" and any(w in text for w in _NO_MEET):
        flag(2, "Refuses to meet in person")
    if any(w in text for w in _NO_TEST):
        flag(2, "Refuses testing")
    if mentions_lock:
        flag(3, "Activation Lock / iCloud mentioned")

    level = "HIGH" if pts >= 4 else "MEDIUM" if pts >= 2 else "LOW"
    return RiskResult(level, pts, reasons)
