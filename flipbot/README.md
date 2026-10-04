# FlipDesk — local iPhone flipping desk

A local-only, 24/7 assistant that finds undervalued used iPhones, scores them against
**your** buying rules, alerts you on Telegram and tracks inventory and profit. It never
buys, pays, accepts an offer or messages a seller on its own.

This is **Phases 1–2 of the build plan**: foundation, deal engine, dashboard, Telegram
wiring, inspection checklists and inventory, all running in **PAPER mode**. See
[What's real vs. mocked](#whats-real-vs-mocked).

```bash
cd flipbot
pip install -r requirements.txt
cp config.example.yaml config.yaml      # optional in PAPER mode
cp .env.example .env                    # Telegram + Claude keys go here
python -m flipbot                       # → http://127.0.0.1:8765
python -m flipbot status                # is it running?
python -m pytest -q                     # 47 tests
```

## The dashboard

The design is adapted from your reference screenshot. Each piece of the reference has a
FlipDesk counterpart:

| Reference | FlipDesk |
|---|---|
| Mauve-to-charcoal app frame on near-black, black inset sidebar, gradient active pill | Same frame and sidebar: Dashboard · Deals · Inventory · Analytics · Markets, with Settings · Activity at the bottom and a PAPER/LIVE mode card |
| "Welcome, Nadia" + bell, gear, avatar | "Welcome, ‹your name›" from `owner.display_name`. Subtitle shows candidates today, hot count and your base. The bell lights up when there are HOT deals |
| Market / Wallet / Tools pills | All / Pickup / Shipped filter |
| "Ask helios.ai anything" | **Share-to-bot bar**: paste a listing (link + text) to get it scored in place |
| Total Holding card with glow | Realized profit (Month / All), plus pending profit and stock value |
| "Decisions powered by data" glow card | Best opportunity right now, with a glowing *Open deal card* button |
| Watchlist (Most viewed / Gain / Lose) | Deal Feed (All / Hot / Negotiate): marketplace, score, place, travel time, price, profit |
| My Portfolio 2×2 tiles | Inventory tiles: value, margin, model, status |
| Portfolio Performance area chart, 1D–1Y, tooltip | Profit Performance: cumulative net profit, 1W–1Y, crosshair tooltip, table view |

Clicking a deal opens the **deal card**, which shows:

- the Deal Score ring and a separate Risk badge
- price, your max buy and expected sale
- every fact tagged VERIFIED / LIKELY / UNKNOWN / RED FLAG
- a point-by-point *Why it scored N*
- warnings, the profit breakdown, a negotiation plan and copy-ready Greek messages
- Approve and Reject buttons

Clicking an inventory item gives you allowed status moves and the inspection checklist
(PASS / FAIL / UNKNOWN per item).

Fonts (Manrope, JetBrains Mono, both with Greek) are served locally, so nothing loads
from a CDN. The layout collapses to a bottom tab bar on phones.

## How a listing is scored

```
dedup (id/url · Vendora→Facebook mirror · same seller+price · photo hash)
 → parse (regex + Greek dictionaries; AI only when model/storage stay unclear)
 → hard rejects (iCloud, parts, wanted/exchange ads, > hard max travel, …)
 → MY MAX BUY from the imported spreadsheet
 → resale valuation (weighted comps, never the top listing) → expected sale
 → profit (expected sale − purchase − repair reserve − fees − shipping − round-trip travel)
 → Risk Score (separate gate: LOW / MEDIUM / HIGH with reasons)
 → Deal Score 0–100 (price 30 · profit 25 · condition 15 · listing 10 · location 10 · liquidity 10)
 → tier: HOT (score ≥ hot & risk LOW) · GOOD · NEGOTIATE (above max, inside band) · WATCH · REJECTED
```

Location is tiered and **closer is always better**. A 5- or 10-minute deal gets full
location points, and 40 minutes is a preferred *maximum*. Beyond the hard max (60 min) a
deal is excluded unless the exceptional-deal override applies.

## Configuration and LIVE mode

Every money value from the brief (`___`) ships as `null` in `config.example.yaml`.

- **PAPER mode** fills unset values with clearly labelled placeholders so the simulation can run.
- **LIVE mode** refuses to start until every required value is set and a real (non-sample)
  price spreadsheet is imported. The Settings page and `/settings` in Telegram list
  what's missing.

## Telegram

1. Create a bot with **@BotFather** and copy the token.
2. Message **@userinfobot** to get your numeric user ID.
3. Put both in `.env` as `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ALLOWED_USER_IDS`.

The bot uses long polling (no open ports) and answers only whitelisted IDs.

- **Commands:** `/start /status /deals /topdeals /inventory /profit /today /settings /health /pause /resume /quiet [hours]`
- **Sharing:** send it a listing's link + text and it replies with the deal card.
- **Card buttons:** OPEN · APPROVE · REJECT · CHECKLIST · DRAFT MSG.

## Running 24/7

"24/7 local-only" means the computer must stay powered on and online; nothing runs while
it's off. On restart, FlipDesk reports how long it was down (heartbeat gap), sends a
morning heartbeat, and takes a rotated database backup daily at 03:17 (`backups/`).

Service files are in `deploy/`:

- **Linux:** `deploy/flipdesk.service` (systemd, `Restart=always`)
- **macOS:** `deploy/com.flipdesk.plist` (launchd, `KeepAlive`)
- **Windows:** `deploy/install-windows-task.ps1` (Task Scheduler, at logon, restart on failure)

Also set the OS to never sleep and to *restart after power failure* (BIOS or Energy
settings).

For phone access, install Tailscale on both devices and start with `--host <tailscale-ip>`.
Never expose the dashboard to the public internet.

## What's real vs. mocked

| Part | State |
|---|---|
| Parser, price-rule import, valuation, profit, Risk Score, Deal Score, tiers, dedup | **Real**, tested |
| Dashboard, API, inventory state machine, inspection checklists, negotiation drafts | **Real**, tested |
| Telegram bot (commands, whitelist, buttons, quiet hours) | **Real code**, logic tested. **Not yet run against live Telegram** (needs your token) |
| Listings, comparables, inventory history, price rules | **PAPER**: simulated, flagged `is_paper`, SAMPLE price rules |
| Marketplace connectors (Vendora, Facebook, Vinted, Skoop) | **Not built.** They make no network requests until the [feasibility review](docs/FEASIBILITY.md) is approved. Share-to-bot works for all four |
| Drive times | No routing provider yet. Travel shows UNKNOWN for shared listings (Phase 3) |
| Screenshot intake, AI parsing, listing generator | Phase 4 / 8. Needs your Claude API key |
