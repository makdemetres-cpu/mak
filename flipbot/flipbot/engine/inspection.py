"""Inspection checklists: in-person (before paying) and inspect-on-arrival (shipped)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Inspection, InspectionItem

IN_PERSON_ONLY = "Meeting"

CHECKLIST: list[tuple[str, list[str]]] = [
    ("Identity & lock status", [
        "Model and storage match (Settings → General → About)",
        "Model number prefix noted (M new · F Apple refurbished · N replacement · P personalised)",
        "IMEI matches box / SIM tray",
        "Region / SIM: physical SIM tray present? US eSIM-only unit?",
        "Carrier lock: works with my SIM",
        "Find My is off; seller signs out of their Apple ID in front of me",
        "Erase All Content and Settings done in front of me; reaches 'Hello' without the old Apple ID",
    ]),
    ("Parts & battery", [
        "Parts and Service History: no 'Unknown part' / non-genuine display, battery or camera",
        "Battery Health % (and cycle count on iPhone 15+)",
    ]),
    ("Hardware", [
        "Touchscreen: drag an icon across the whole screen; no dead zones",
        "Display: uniformity, dead pixels, burn-in, True Tone, brightness",
        "All cameras, flash, focus, stabilisation",
        "Face ID / Touch ID",
        "Speakers (top and bottom), microphones (voice memo), vibration",
        "Charging port + wireless / MagSafe charging",
        "Buttons, silent switch / Action button, Camera Control (16 series)",
        "Wi-Fi, Bluetooth, mobile data, calls, GPS",
    ]),
    ("Physical", [
        "Screen, back glass, frame dents, camera lenses",
        "Water damage indicators; signs of opening (screws, glue, display gaps)",
    ]),
    (IN_PERSON_ONLY, [
        "Meeting in a public place",
        "Ownership: receipt / proof if available; no odd story",
        "Price agreed and accessories present",
        "Payment: cash or IRIS at handover — never a deposit before seeing the phone",
    ]),
]


def template(path: str) -> list[tuple[str, list[str]]]:
    return [(s, items) for s, items in CHECKLIST if path == "in_person" or s != IN_PERSON_ONLY]


def start(session: Session, path: str, inventory_id: int | None = None,
          listing_id: int | None = None) -> Inspection:
    insp = Inspection(path=path, inventory_id=inventory_id, listing_id=listing_id)
    for section, labels in template(path):
        for label in labels:
            insp.items.append(InspectionItem(section=section, label=label))
    session.add(insp)
    session.flush()
    return insp


def record(session: Session, item_id: int, result: str, note: str | None = None) -> InspectionItem:
    if result not in ("PASS", "FAIL", "UNKNOWN"):
        raise ValueError("result must be PASS, FAIL or UNKNOWN")
    item = session.get(InspectionItem, item_id)
    if item is None:
        raise KeyError(item_id)
    item.result, item.note = result, note
    return item


def decide(session: Session, inspection_id: int, decision: str) -> Inspection:
    insp = session.get(Inspection, inspection_id)
    if insp is None:
        raise KeyError(inspection_id)
    allowed = ("BUY", "WALK_AWAY") if insp.path == "in_person" else ("KEEP", "RETURN")
    if decision not in allowed:
        raise ValueError(f"decision must be one of {allowed}")
    if decision in ("BUY", "KEEP"):
        unanswered = [i.label for i in insp.items if i.result == "UNKNOWN"]
        failed = [i.label for i in insp.items if i.result == "FAIL"]
        if unanswered:
            raise ValueError(f"{len(unanswered)} checklist items are still UNKNOWN")
        if any("Find My" in f or "Erase All" in f for f in failed):
            raise ValueError("Activation Lock / erase check failed — this phone cannot be bought")
    insp.decision = decision
    return insp


def return_request_text(insp: Inspection) -> str:
    failed = [i for i in insp.items if i.result == "FAIL"]
    lines = ["Καλησπέρα σας. Παρέλαβα τη συσκευή και κατά τον έλεγχο διαπίστωσα τα εξής:"]
    lines += [f"• {i.label}" + (f" — {i.note}" if i.note else "") for i in failed]
    lines.append("Η συσκευή δεν αντιστοιχεί στην περιγραφή της αγγελίας, γι' αυτό ζητώ "
                 "επιστροφή μέσω της πλατφόρμας. Ευχαριστώ.")
    return "\n".join(lines)


def has_decision(session: Session, inventory_id: int, decision: str) -> bool:
    return session.scalars(select(Inspection).where(
        Inspection.inventory_id == inventory_id, Inspection.decision == decision)).first() is not None
