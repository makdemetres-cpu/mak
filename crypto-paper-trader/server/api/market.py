from typing import Literal

from fastapi import APIRouter, Path, Query, Request

router = APIRouter(prefix="/api")

Currency = Literal["USD", "EUR"]
Range = Literal["1D", "1W", "1M", "1Y", "5Y"]
Symbol = Path(pattern=r"^[A-Za-z0-9]{1,15}$")


@router.get("/assets/search")
async def search(request: Request, q: str = Query("", max_length=40)):
    return await request.app.state.market.search(q)


@router.get("/assets/{symbol}/quote")
async def quote(request: Request, symbol: str = Symbol, currency: Currency = "USD"):
    return await request.app.state.market.quote_report(symbol, currency)


@router.get("/assets/{symbol}/candles")
async def candles(request: Request, symbol: str = Symbol, currency: Currency = "USD", range: Range = "1D"):
    return await request.app.state.market.candles_report(symbol, currency, range)


@router.get("/exchanges/status")
async def exchange_status(request: Request):
    return {"exchanges": await request.app.state.market.exchange_status()}
