"""Telegram remote control (long polling — no inbound ports, no public webhook).

Only whitelisted user IDs are answered; everyone else is ignored and logged.
No command here can buy, pay, or message a seller.
"""

from __future__ import annotations

import logging
from datetime import timedelta

from .engine import negotiation
from .models import Listing
from .service import FlipDesk, in_quiet_hours

log = logging.getLogger("flipbot.telegram")

TIER_ICON = {"HOT": "🔥", "GOOD": "✅", "NEGOTIATE": "💬", "WATCH": "👀", "REJECTED": "⛔"}
COMMANDS = ["start", "status", "deals", "topdeals", "inventory", "profit", "today",
            "settings", "health", "pause", "resume", "quiet"]


def deal_card(listing: Listing, mirrors: list[Listing] | None = None, paper: bool = False) -> str:
    ev = listing.evaluation or {}
    head = f"{TIER_ICON.get(listing.tier, '')} {listing.tier} — {listing.model or listing.title}"
    if listing.storage_gb:
        head += f" {listing.storage_gb}GB"
    lines = [("[PAPER] " if paper else "") + head]
    money = f"Price €{listing.price:.0f}"
    if listing.my_max_buy is not None:
        money += f" · My max €{listing.my_max_buy:.0f}"
    if listing.expected_sale is not None:
        money += f" · Expected sale €{listing.expected_sale:.0f}"
    lines.append(money)
    if listing.net_profit is not None:
        lines.append(f"Net profit €{listing.net_profit:.0f} · ROI {listing.roi_percent:.1f}% · "
                     f"Deal {listing.deal_score:.0f}/100 · Risk {listing.risk_level}")
    else:
        lines.append(f"Risk {listing.risk_level} · profit unknown")
    facts = ev.get("facts", {})
    bh = facts.get("battery_health", [None])[0]
    face = facts.get("face_id", [None])[0]
    lines.append(f"Battery {f'{bh}%' if bh else 'unknown'} · Condition "
                 f"{(listing.condition or 'unknown').replace('_', ' ')} · Face ID {face or 'unknown'}")
    if listing.delivery == "shipped":
        lines.append("📦 Delivery: shipped (inspect on arrival)")
    else:
        travel = f"~{listing.travel_minutes:.0f} min" if listing.travel_minutes is not None else "UNKNOWN"
        lines.append(f"📍 {listing.location or 'unknown'} · 🚗 {travel} "
                     f"({listing.location_confidence} confidence)")
    src = listing.marketplace.capitalize()
    if mirrors:
        src += " (+ seen on " + ", ".join(sorted({m.marketplace.capitalize() for m in mirrors})) + ")"
    lines.append(src)
    if ev.get("positives"):
        lines.append("WHY: " + " · ".join("+ " + p for p in ev["positives"]))
    if ev.get("warnings"):
        lines.append("\n".join("⚠️ " + w for w in ev["warnings"][:4]))
    if ev.get("rejects"):
        lines.append("\n".join("⛔ " + r for r in ev["rejects"]))
    return "\n".join(lines)


def is_allowed(user_id: int | None, allowed: frozenset[int]) -> bool:
    return user_id is not None and user_id in allowed


class TelegramBot:
    def __init__(self, desk: FlipDesk):
        self.desk = desk
        self.app = None
        self.quiet_queue: list[tuple[str, int | None]] = []
        self.manual_quiet_until = None

    def enabled(self) -> bool:
        return bool(self.desk.secrets.telegram_bot_token and self.desk.secrets.telegram_allowed_user_ids)

    # ---------------------------------------------------------------- sending
    async def send(self, text: str, listing_id: int | None = None, kind: str = "info",
                   urgent: bool = False) -> None:
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup

        quiet = in_quiet_hours(self.desk.cfg) or self._manual_quiet()
        if quiet and not (urgent and self.desk.cfg.notifications.hot_bypasses_quiet_hours):
            self.quiet_queue.append((text, listing_id))
            return
        markup = None
        if listing_id is not None:
            found = self.desk.listing(listing_id)
            row = []
            if found and found[0].url and not found[0].url.startswith("https://example.invalid"):
                row.append(InlineKeyboardButton("OPEN", url=found[0].url))
            row += [InlineKeyboardButton("APPROVE", callback_data=f"approve:{listing_id}"),
                    InlineKeyboardButton("REJECT", callback_data=f"reject:{listing_id}")]
            markup = InlineKeyboardMarkup([row, [
                InlineKeyboardButton("CHECKLIST", callback_data=f"checklist:{listing_id}"),
                InlineKeyboardButton("DRAFT MSG", callback_data=f"draft:{listing_id}")]])
        for uid in self.desk.secrets.telegram_allowed_user_ids:
            await self.app.bot.send_message(uid, text, reply_markup=markup,
                                            disable_web_page_preview=True)

    def _manual_quiet(self) -> bool:
        from .models import utcnow
        return self.manual_quiet_until is not None and utcnow() < self.manual_quiet_until

    async def flush_quiet_queue(self) -> None:
        if in_quiet_hours(self.desk.cfg) or self._manual_quiet():
            return
        queued, self.quiet_queue = self.quiet_queue, []
        for text, listing_id in queued:
            await self.send(text, listing_id)

    async def alert(self, listing: Listing, reason: str) -> None:
        found = self.desk.listing(listing.id)
        mirrors = found[1] if found else []
        text = deal_card(listing, mirrors, paper=self.desk.cfg.mode == "PAPER")
        if reason != "new":
            text = f"📉 {reason}\n" + text
        await self.send(text, listing.id, kind="deal", urgent=listing.tier == "HOT")

    # --------------------------------------------------------------- handlers
    def _guard(self, update) -> bool:
        uid = update.effective_user.id if update.effective_user else None
        if not is_allowed(uid, self.desk.secrets.telegram_allowed_user_ids):
            log.warning("Ignored Telegram update from non-whitelisted user %s", uid)
            return False
        return True

    async def on_command(self, update, context) -> None:
        if not self._guard(update):
            return
        cmd = update.message.text.split()[0].lstrip("/").split("@")[0].lower()
        await update.message.reply_text(self.command_text(cmd, context.args or []),
                                        disable_web_page_preview=True)

    def command_text(self, cmd: str, args: list[str]) -> str:
        d = self.desk
        o = d.overview()
        if cmd in ("start", "status", "health"):
            rows = d.connector_rows()
            lines = [f"FlipDesk · {o['mode']} mode" + (" · PAUSED" if o["paused"] else ""),
                     f"Uptime {timedelta(seconds=o['uptime_seconds'])}"]
            lines += [f"• {r['display_name']}: {r['state']} — {r['detail']}" for r in rows]
            if cmd == "start":
                lines.append("\nShare a listing (link + text) here and I'll score it.")
            return "\n".join(lines)
        if cmd in ("deals", "topdeals"):
            deals = d.deals() if cmd == "deals" else d.deals(("HOT",))
            if not deals:
                return "No open deals right now."
            return "\n".join(f"{TIER_ICON[x.tier]} #{x.id} {x.model} {x.storage_gb}GB · €{x.price:.0f} · "
                             f"score {x.deal_score or 0:.0f} · risk {x.risk_level}" for x in deals[:10])
        if cmd == "inventory":
            items = d.inventory(statuses=None)
            open_items = [i for i in items if i.status not in ("COMPLETED", "CANCELLED", "REJECTED", "RETURNED")]
            return "\n".join(f"{i.code} {i.model} {i.storage_gb}GB · {i.status}" for i in open_items[:15]) \
                or "Inventory is empty."
        if cmd in ("profit", "today"):
            return (f"Realized profit €{o['realized_profit']:.0f} ({o['flips_completed']} flips)\n"
                    f"This month €{o['realized_profit_month']:.0f} · Pending €{o['pending_profit']:.0f}\n"
                    f"Candidates today {o['candidates_today']} · HOT {o['hot_deals']}")
        if cmd == "settings":
            blockers = o["live_blockers"]
            return f"Mode {o['mode']}. " + (
                "LIVE is blocked until you set:\n• " + "\n• ".join(blockers) if blockers else "Ready for LIVE.")
        if cmd == "pause":
            d.set_paused(True)
            return "Scanning paused. /resume to continue."
        if cmd == "resume":
            d.set_paused(False)
            return "Scanning resumed."
        if cmd == "quiet":
            from .models import utcnow
            hours = int(args[0]) if args and args[0].isdigit() else 8
            self.manual_quiet_until = utcnow() + timedelta(hours=hours)
            return f"Quiet for {hours} h (HOT deals still come through)."
        return "Unknown command."

    async def on_text(self, update, context) -> None:
        if not self._guard(update):
            return
        text = update.message.text or update.message.caption or ""
        if update.message.photo and not text:
            await update.message.reply_text(
                "Screenshot intake needs the AI vision step (Phase 4). For now, paste the listing text.")
            return
        try:
            listing, _ = self.desk.intake_text(text)
        except ValueError as exc:
            await update.message.reply_text(f"Couldn't read that listing: {exc}")
            return
        found = self.desk.listing(listing.id)
        await self.send(deal_card(listing, found[1] if found else [],
                                  paper=self.desk.cfg.mode == "PAPER"), listing.id, urgent=True)

    async def on_button(self, update, context) -> None:
        if not self._guard(update):
            return
        query = update.callback_query
        await query.answer()
        action, _, raw_id = query.data.partition(":")
        listing_id = int(raw_id)
        found = self.desk.listing(listing_id)
        if not found:
            await query.message.reply_text("Listing not found.")
            return
        listing = found[0]
        if action == "approve":
            item = self.desk.decide(listing_id, "APPROVED")
            await query.message.reply_text(f"Approved → {item.code}. Contact the seller yourself; "
                                           "start the inspection when you meet.")
        elif action == "reject":
            self.desk.decide(listing_id, "REJECTED")
            await query.message.reply_text("Rejected.")
        elif action == "draft":
            p = negotiation.plan(self.desk.cfg, listing)
            drafts = negotiation.drafts(self.desk.cfg, listing)
            await query.message.reply_text(
                f"Opening €{p['opening']} · Target €{p['target']} · Absolute max €{p['absolute_max']:.0f}\n\n"
                f"{drafts['opening']}\n\n(Copy and send it yourself — I never message sellers.)")
        elif action == "checklist":
            from .engine.inspection import template
            path = "on_arrival" if listing.delivery == "shipped" else "in_person"
            lines = []
            for section, labels in template(path):
                lines.append(f"\n{section}")
                lines += [f"☐ {label}" for label in labels]
            await query.message.reply_text("Inspection checklist" + "\n".join(lines))

    # ---------------------------------------------------------------- running
    def build(self):
        from telegram.ext import (Application, CallbackQueryHandler, CommandHandler,
                                  MessageHandler, filters)
        self.app = Application.builder().token(self.desk.secrets.telegram_bot_token).build()
        self.app.add_handler(CommandHandler(COMMANDS, self.on_command))
        self.app.add_handler(CallbackQueryHandler(self.on_button))
        self.app.add_handler(MessageHandler((filters.TEXT | filters.PHOTO) & ~filters.COMMAND, self.on_text))
        self.desk.notify = self.alert
        return self.app

    async def start(self) -> None:
        app = self.build()
        await app.initialize()
        await app.start()
        await app.updater.start_polling(drop_pending_updates=False)
        log.info("Telegram long polling started")

    async def stop(self) -> None:
        if self.app:
            await self.app.updater.stop()
            await self.app.stop()
            await self.app.shutdown()
