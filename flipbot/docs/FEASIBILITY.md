# Marketplace feasibility review — PENDING

The brief requires a per-marketplace, per-operation decision backed by a cited source
(Terms of Service, robots.txt, official API or partner docs). **That research has not been
done yet.** Until it has been done and the owner approves it, every connector runs
share-to-bot only and makes no network requests.

| Marketplace | search | fetch | publish | update | mark sold | Source |
|---|---|---|---|---|---|---|
| Vendora | PENDING | PENDING | PENDING | PENDING | ASSISTED | to research |
| Facebook Marketplace | PENDING (expected ASSISTED) | PENDING | PENDING (expected ASSISTED) | PENDING | ASSISTED | to research |
| Vinted | PENDING (expected ASSISTED) | PENDING | PENDING (expected ASSISTED) | PENDING | ASSISTED | to research |
| Skoop by Skroutz | PENDING | PENDING | PENDING | PENDING | ASSISTED | to research |
| Manual intake | ASSISTED | ASSISTED | ASSISTED | ASSISTED | ASSISTED | n/a, owner-driven |

Values: `AUTOMATED (permitted)` · `ASSISTED (manual step)` · `NOT POSSIBLE`.

## Still needed from the owner

1. The OS and machine that will run 24/7.
2. The real buying-price spreadsheet. The app currently uses `flipbot/paper/sample_price_rules.csv`, which is SAMPLE data.
3. Telegram bot token and your numeric Telegram user ID.
4. Claude API key and a monthly AI budget.
5. Routing provider: OpenRouteService free tier (needs a free key) or self-hosted OSRM.
6. Every `null` money value in `config.example.yaml`: minimum profit and ROI, HOT and GOOD
   thresholds, repair reserve, €/km, negotiation band and buffer, per-platform fees, and the
   exceptional-deal minimum profit.
