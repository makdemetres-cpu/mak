# FlipDesk — local iPhone flipping desk

A local-only, 24/7 assistant that finds undervalued used iPhones, scores them against
**your** buying rules, alerts you on Telegram and tracks inventory and profit. It never
buys, pays, accepts an offer or messages a seller on its own.

This is **Phases 1–2 of the build plan**: foundation, deal engine, dashboard, Telegram
wiring, inspection checklists and inventory, all running in **PAPER mode**. See
[What's real vs. mocked](#whats-real-vs-mocked).

**On Windows, follow [SETUP-WINDOWS.md](SETUP-WINDOWS.md)** (click-by-click). In short:

| File | What it does |
|---|---|
| `start.bat` | First run: creates `.venv`, installs requirements, creates `.env` and `config.yaml` from the examples. Then starts FlipDesk in the background (with a watchdog that restarts it if it crashes) and opens the dashboard |
| `stop.bat` | Graceful stop (force-stop only as a last resort) |
| `status.bat` | Running? Mode, uptime, Telegram state, auto-start on/off |
| `install-autostart.bat` / `remove-autostart.bat` | Task Scheduler task that starts FlipDesk ~1 min after Windows boots, even before login |

Secrets live only in `.env` in this folder (git-ignored); `.env.example` lists every variable.

Developers (any OS):

```bash
pip install -r requirements.txt
python -m flipbot start     # launcher + watchdog → http://127.0.0.1:8765
python -m flipbot status
python -m flipbot stop
python -m pytest -q
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

Put the bot token from **@BotFather** and your numeric user ID from **@userinfobot** in
`.env` (see SETUP-WINDOWS.md). The bot uses long polling (no open ports) and answers only
whitelisted IDs. If Telegram is unreachable at boot it retries every 2 minutes, and
queued notices (for example "was down for 3 h") are delivered once it connects.

- **Commands:** `/start /status /deals /topdeals /inventory /profit /today /settings /health /pause /resume /quiet [hours]`
- **Sharing:** send it a listing's text and it replies with the deal card.
- **Card buttons:** OPEN · APPROVE · REJECT · CHECKLIST · DRAFT MSG.

## Running 24/7

"24/7 local-only" means the PC must stay powered on and online; nothing runs while it's
off. `python -m flipbot start` is a small launcher that runs the server and restarts it
with back-off if it crashes. The Windows auto-start task restarts the launcher itself.
On restart FlipDesk reports how long it was down (heartbeat gap). It sends a morning
heartbeat and takes a rotated database backup daily at 03:17 (`backups/`).

For phone access, install Tailscale on both devices and start with `--host <tailscale-ip>`.
Never expose the dashboard to the public internet.

## Marketplaces

The [feasibility review](docs/FEASIBILITY.md) found that **no platform permits automated
scanning for a private user**: Meta, Vinted and Skroutz forbid it, and Vendora's terms
could not be verified. Discovery therefore runs on share-to-bot everywhere, and the bot
never opens a shared link itself. Vendora payments must go through "Buy via Vendora",
also at meetups; the checklist and messages say so for Vendora deals.

## What's real vs. mocked

| Part | State |
|---|---|
| Parser, price-rule import, valuation, profit, Risk Score, Deal Score, tiers, dedup | **Real**, tested |
| Dashboard, API, inventory state machine, inspection checklists, negotiation drafts | **Real**, tested |
| Telegram bot (commands, whitelist, buttons, quiet hours, retry) | **Real code**, logic tested. **Not yet run against live Telegram** |
| Windows `.bat` files and auto-start | **Written, not yet run on Windows.** The launcher/stop/status logic behind them is tested on Linux |
| Listings, comparables, inventory history, price rules | **PAPER**: simulated, flagged `is_paper`, SAMPLE price rules |
| Marketplace connectors (Vendora, Facebook, Vinted, Skoop) | **No scanning**, per the [feasibility review](docs/FEASIBILITY.md) (awaiting approval). Share-to-bot works for all four |
| Drive times | OpenRouteService chosen, key goes in `.env`; client not built yet (Phase 3). Travel shows UNKNOWN for shared listings |
| Screenshot intake, AI parsing, listing generator | Phase 4 / 8. Needs your Claude API key |
