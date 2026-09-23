# Crypto Paper Trader

A research and practice app for crypto that runs only on your own computer. It shows real prices from
trusted exchanges, tells you where every number came from and how old it is, and lets you practice
with pretend money. It never places real trades.

> Research and practice tool. Not financial advice. Even correct data can't guarantee a profit.

## What works so far

The app is being built in stages. Stage 1 is done:

- Search any coin traded on Coinbase or Kraken.
- A coin page with the price, the 24-hour change, high, low, volume, bid and ask.
- A price chart for 1 day, 1 week, 1 month, 1 year and 5 years, as a line or as candles.
- Prices in US dollars or euros (switch at the top right).
- A label on every price: **Live**, **Stale**, **End of day** or **No data**, plus the exchange, the market and the time.
- A **price check** that compares Coinbase with Kraken and Alpaca and warns you if they disagree by more than 0.5%.
- Warnings for impossible prices, missing volume, unusual 24-hour moves, stablecoins losing their peg, and exchanges that don't answer.
- Exchange status for Coinbase and Kraken on the Home page.
- Light and dark mode.

Still to come: news and watchlists, paper trading, the Learn the Words glossary, the AI assistant, and
copy-trading research (fund holdings and Congress trades).

## Start the app (Windows)

1. Download this folder and unzip it anywhere, for example `Documents\crypto-paper-trader`.
2. Double-click **Start Crypto Paper Trader.bat**.
   - The first time, it installs [uv](https://docs.astral.sh/uv/), a free tool that sets up Python for the
     app. This needs an internet connection and takes about a minute.
   - If Windows shows "Windows protected your PC", click **More info**, then **Run anyway**. The script is
     plain text; you can open it in Notepad to see what it does.
3. Your browser opens at `http://127.0.0.1:8765`. Keep the black window open while you use the app.
   Close it to stop the app.

Only your computer can open the app. It refuses connections from other devices.

### Check that the data sources work

Double-click **Check Data Sources.bat**. It asks each exchange for a price and a chart and prints
`OK` or `PROBLEM` for each one. Run it if prices look wrong or the app shows many warnings.

## Settings file (.env)

The first start creates a file called `.env` in the app folder. Open it with Notepad to add optional keys.
The app works without any of them in Stage 1.

| Setting | Needed for | How to get it |
|---|---|---|
| `SEC_CONTACT_EMAIL` | Fund holdings (later stage) | Your email. The SEC requires apps to identify themselves. It is only sent to sec.gov. |
| `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY` | Higher Alpaca limits; news (later stage) | Sign up at [alpaca.markets](https://alpaca.markets), open the **Paper** account, and create API keys. Paper keys start with `PK`. |
| `COINGECKO_DEMO_API_KEY` | Coin supply and market cap (later stage) | Free Demo key at [coingecko.com/en/api](https://www.coingecko.com/en/api). |
| `ANTHROPIC_API_KEY` | AI assistant with Claude (later stage) | [console.anthropic.com](https://console.anthropic.com). Costs a little per question. |
| `OLLAMA_URL` | AI assistant with a local model (later stage) | Install [Ollama](https://ollama.com). The default address works. |

`.env` is never uploaded anywhere and is excluded from git.

## Safety rules the app enforces

- **Paper money only.** The app has no code that places orders. Its web client only talks to a fixed list
  of data sources and refuses trading addresses (for example `api.alpaca.markets` or Kraken's private API).
- **It won't start** if `.env` contains a live Alpaca key (starts with `AK`), any Coinbase, Kraken or Binance
  account key, a real-money trading address, or a `HOST` other than `127.0.0.1`.
- **Local only.** The server listens on `127.0.0.1` and rejects requests addressed to any other hostname.
- **Keys stay private.** Keys are read from `.env`, sent only to the service they belong to, and hidden from logs.

## Where the data comes from

| Data | Source | Notes |
|---|---|---|
| Prices, 24-hour numbers, charts | [Coinbase Exchange](https://docs.cdp.coinbase.com/exchange/introduction/welcome) public API | Main source. Real-time, no key needed. |
| Second price and backup chart | [Kraken](https://docs.kraken.com/api/) public API | Used for the price check, and instead of Coinbase if Coinbase doesn't answer. |
| Third price | [Alpaca](https://docs.alpaca.markets/docs/historical-crypto-data-1) crypto data | US dollar markets only. Market data only, never trading. |
| Euro conversion | [European Central Bank](https://data.ecb.europa.eu/) daily reference rate | Used only when a coin has no euro market. |
| Exchange status | status.coinbase.com and Kraken's system status | |

### How euro prices work

If Coinbase or Kraken has a real euro market for a coin (like BTC-EUR), the app shows that price. If not,
it converts the US dollar price with the ECB's reference rate, puts **≈** in front of the price, and says
which day's rate it used. The ECB publishes one rate per working day around 16:00 Central European Time,
so a converted price can be off by however much the euro moved since then.

### What the labels mean

- **Live**: the exchange reported a trade in the last 5 minutes.
- **Stale**: the last trade is older than 5 minutes, or the app couldn't refresh and is showing the last price it got. The message says which.
- **End of day**: a chart with one point per day or week. Past points are final; the newest one is still changing.
- **No data**: nothing trustworthy to show, so no number is shown.

## If something goes wrong

- **"Couldn't reach Coinbase Exchange"**: check your internet connection. If only one exchange fails, the app uses the other and tells you.
- **The window closes right away**: open a Command Prompt in the app folder and run `"Start Crypto Paper Trader.bat"` to read the message.
- **uv didn't install**: install it by hand from [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/), then start the app again.
- **Port 8765 is in use**: set `PORT=8766` in `.env`.

## For developers

```sh
uv run pytest                 # backend tests
cd frontend && npm install
npm run dev                   # frontend dev server on :5173, proxies /api to :8765
npm run build                 # builds into server/web, which the app serves
```

- Backend: Python, FastAPI, httpx, SQLite (`data/app.db`). Code in `server/`.
- Frontend: React, TypeScript, Vite, [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts). Code in `frontend/`.
- `server/web` holds the built frontend and is committed, so people running the app don't need Node.
- Tests use fake exchanges in `tests/fakes.py` whose replies follow each provider's documented format.
  `python -m server.check` tests the real services.
