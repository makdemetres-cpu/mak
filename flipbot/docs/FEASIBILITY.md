# Marketplace feasibility review

**Status: research done — waiting for the owner's approval. No marketplace scanning is built.**
Researched 4 October 2026.

**How this was researched.** The research ran in a cloud session whose network policy
blocks vendora.gr, facebook.com, vinted.*, and skroutz.gr. So the decisions below come
from web-search excerpts of each platform's own pages (cited), not from reading the pages
directly. Vendora's Terms of Use could not be read at all. Its row is therefore
**NOT VERIFIED** and treated conservatively.

Values: `AUTOMATED (permitted)` · `ASSISTED (manual step)` · `NOT POSSIBLE`.

## The table

| Marketplace | Search (find new listings) | Fetch (open a shared link) | Publish | Update | Mark sold |
|---|---|---|---|---|---|
| **Vendora** | ASSISTED, NOT VERIFIED ¹ | ASSISTED, NOT VERIFIED ¹ | ASSISTED (copy & paste) ² | ASSISTED | ASSISTED |
| **Facebook Marketplace** | ASSISTED ³ | ASSISTED ³ | ASSISTED, and not needed: Vendora listings already appear there ⁴ | ASSISTED | ASSISTED |
| **Vinted** | ASSISTED ⁵ | ASSISTED ⁵ | ASSISTED ⁶ | ASSISTED ⁶ | ASSISTED |
| **Skoop by Skroutz** | ASSISTED ⁷ | ASSISTED ⁷ | ASSISTED ⁸ | ASSISTED | ASSISTED |
| **Manual intake** (you share a listing) | ASSISTED | ASSISTED | n/a | n/a | n/a |

**Bottom line:** no platform permits automated scanning for a private user. Discovery
runs on **share-to-bot** on every platform. You paste the listing text, or later a
screenshot, into Telegram or the dashboard, and the bot scores it in seconds. "Fetch"
also stays manual: the bot works from what you paste and never opens the link itself,
because a bot opening the page is still automated access under these terms.

## Findings and sources

1. **Vendora — automated access.** No public API or developer programme was found.
   Vendora's Terms of Use exist ([Terms of Use](https://support.vendora.gr/knowledge-base/terms-of-use/?lang=en),
   last updated 17 Jan 2025), but their wording on bots and scraping could not be read
   from here. Until you or I read that clause, Vendora is treated like the others:
   no automated search or fetch.
2. **Vendora — publishing.** No public listing API was found, so listings are
   prepared by the bot and pasted in by you.
   **Important for buying:** Vendora allows payment *only* through
   "Buy via Vendora". Bank transfer, cash on delivery and cash payments break the terms
   and can get the account banned.
   ([Buy via Vendora](https://support.vendora.gr/knowledge-base/buy-via-vendora-service/?lang=en),
   [Purchase process](https://support.vendora.gr/knowledge-base/buying-procedure/?lang=en)).
   Meetups still work: the buyer prepays in the app and has 30 minutes at the meetup to
   inspect and approve. **This changed FlipDesk:** for Vendora deals, the inspection
   checklist and the Greek messages now say "pay via Buy via Vendora, approve in the app
   within 30 min" instead of "cash or IRIS".
3. **Facebook Marketplace.** Meta's Terms: *"You may not access or collect data from
   our Products using automated means (without our prior permission)… regardless of
   whether such automated access or collection is undertaken while logged-in"*.
   Facebook's robots.txt points to Meta's Automated Data Collection Terms.
   ([Meta Terms of Service](https://www.facebook.com/terms))
4. **Vendora ↔ Facebook.** Vendora listings appear automatically, free, on Facebook
   Marketplace for users in Greece, Cyprus and Bulgaria. Messages and payment stay on
   Vendora.
   ([Vendora: Collaboration with Facebook Marketplace](https://support.vendora.gr/knowledge-base/facebook-marketplace/?lang=en),
   [AIM Group, May 2025](https://aimgroup.com/2025/05/27/vendoras-classified-listings-available-on-facebook-marketplace/))
   So separate Facebook posting is unnecessary, and FlipDesk's mirror detection is needed
   on the buying side.
5. **Vinted — discovery.** Vinted's terms forbid *"any kind of external software tools
   (including but not limited to: bots, scraping programs, crawling programs, spiders)"*
   unless Vinted authorises them, and forbid users to *"data mine, screen scrape,
   crawl…"*. Vinted also actively restricts accounts it suspects of automation.
   ([Vinted Terms and Conditions](https://www.vinted.co.uk/terms_and_conditions))
6. **Vinted — publishing.** An official **Vinted Pro Integrations** API exists
   (Items, Orders and Webhooks), but only for allow-listed **business** (Vinted Pro)
   accounts. It manages your own items only and has no search.
   ([Vinted Pro Integrations docs](https://pro-docs.svc.vinted.com/))
   As a private seller it stays ASSISTED. If you ever register as a business and get
   allow-listed, publish/update/mark-sold could become AUTOMATED.
7. **Skoop / Skroutz — discovery.** Skroutz's FAQ: automatic monitoring of the
   Skroutz site is not allowed without Skroutz's permission (*"η αυτόματη παρακολούθηση
   της σελίδας δεν επιτρέπεται χωρίς την άδεια του Skroutz"*).
   ([Skroutz FAQ](https://www.skroutz.gr/faq), [Skroutz Terms](https://www.skroutz.gr/terms))
8. **Skoop — publishing.** The official Skroutz API
   ([developer.skroutz.gr](https://developer.skroutz.gr/)) needs approved credentials and
   serves merchants and partners, not Skoop's private sellers.
   ([Skoop seller terms](https://www.skroutz.gr/skoop/seller_terms)) KYC (Everypay) and
   payouts are never automated.

## What approving this table means

If you approve it, the next marketplace work is:

- **No scanners, no scrapers, no browser bots** on any platform.
- **Make share-to-bot as fast as possible:**
  - Screenshot intake (AI vision, within your $10/month cap).
  - Greek text intake.
  - Vendora→Facebook mirror detection.
- **Listing drafts** per platform: Greek text plus a photo checklist, ready to paste, and
  one-tap "open the platform" links.
- **Optional, only if you say so:** platform e-mail or push alerts you have switched
  on yourself (for example saved-search notifications) forwarded to the bot, if a
  platform offers them.

Things that would change a row to AUTOMATED: written permission from the platform, an
official API that grants it, or (Vinted) a Vinted Pro business account on the
allow-list.
