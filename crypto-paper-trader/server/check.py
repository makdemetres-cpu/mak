"""Checks that every live data source answers in the shape the app expects."""

import asyncio
import sys

from .config import load_settings
from .http import make_client
from .market.service import MarketService, NotFoundError, UnavailableError
from .safety import SafetyError, enforce


async def run_checks() -> int:
    settings = load_settings()
    enforce(settings)
    failures = 0
    async with make_client() as client:
        service = MarketService(client, alpaca_key_id=settings.alpaca_key_id, alpaca_secret=settings.alpaca_secret)

        def show(ok: bool, label: str, detail: str) -> None:
            nonlocal failures
            failures += 0 if ok else 1
            print(f"  [{'OK' if ok else 'PROBLEM'}] {label}: {detail}")

        print("\nChecking data sources...\n")
        search = await service.search("bitcoin")
        show(bool(search["results"]), "Coin list", f"{len(search['results'])} matches for 'bitcoin'")
        for err in search["errors"]:
            show(False, err["source_name"], err["message"])

        for symbol, currency in (("BTC", "USD"), ("BTC", "EUR"), ("ETH", "EUR")):
            report = await service.quote_report(symbol, currency)
            price = report["price"]["value"] if report["price"] else None
            source = report["source"]["name"] if report["source"] else "none"
            show(price is not None, f"{symbol} in {currency}",
                 f"{price} from {source}, {report['freshness']['label']}, cross-check {report['cross_check']['status']}")
            for comp in report["cross_check"]["comparisons"]:
                print(f"      {comp['source_name']}: {comp['price']} ({comp['note']})")
            for err in report["errors"]:
                show(False, err["source_name"], err["message"])

        for range_key in ("1D", "5Y"):
            chart = await service.candles_report("BTC", "USD", range_key)
            source = chart["source"]["name"] if chart["source"] else "none"
            show(bool(chart["candles"]), f"BTC chart {range_key}",
                 f"{len(chart['candles'])} points from {source}, {chart['freshness']['label']}")

        for status in await service.exchange_status():
            show(status["error"] is None, f"{status['source_name']} status", status["description"])

    print("\nAll sources answered.\n" if not failures else f"\n{failures} problem(s) found. See above.\n")
    return 1 if failures else 0


def main() -> int:
    try:
        return asyncio.run(run_checks())
    except SafetyError as err:
        print("\n".join(err.problems))
    except UnavailableError as err:
        print(f"\n  [PROBLEM] {err}")
        for detail in err.errors:
            print(f"      {detail['message']}")
        print("\nCheck your internet connection, then run this again.\n")
    except NotFoundError as err:
        print(f"\n  [PROBLEM] {err}\n")
    return 1


if __name__ == "__main__":
    sys.exit(main())
