import logging
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .api import market, system
from .config import LOCAL_HOSTS, Settings, load_settings
from .db import Database
from .http import make_client
from .market.service import MarketService, NotFoundError, UnavailableError
from .safety import enforce

WEB_DIR = Path(__file__).resolve().parent / "web"


class RedactKeysFilter(logging.Filter):
    def __init__(self, secrets: list[str]):
        super().__init__()
        self.secrets = [s for s in secrets if s]

    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        if any(s in message for s in self.secrets):
            for secret in self.secrets:
                message = message.replace(secret, "[hidden]")
            record.msg, record.args = message, None
        return True


def create_app(settings: Settings | None = None, transport: httpx.AsyncBaseTransport | None = None, throttle: bool = True) -> FastAPI:
    settings = settings or load_settings()
    enforce(settings)

    redactor = RedactKeysFilter([settings.alpaca_key_id, settings.alpaca_secret, settings.coingecko_key, settings.anthropic_key])
    for handler in logging.getLogger().handlers:
        handler.addFilter(redactor)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    client = make_client(transport, throttle=throttle)
    db = Database(settings.db_path)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        yield
        await client.aclose()
        db.close()

    app = FastAPI(title="Crypto Paper Trader", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=sorted(LOCAL_HOSTS | {"[::1]"}))
    app.state.settings = settings
    app.state.db = db
    app.state.market = MarketService(
        client, alpaca_key_id=settings.alpaca_key_id, alpaca_secret=settings.alpaca_secret
    )

    @app.exception_handler(NotFoundError)
    async def not_found(_: Request, exc: NotFoundError):
        return JSONResponse({"detail": str(exc)}, status_code=404)

    @app.exception_handler(UnavailableError)
    async def unavailable(_: Request, exc: UnavailableError):
        return JSONResponse({"detail": str(exc), "errors": exc.errors}, status_code=503)

    app.include_router(system.router)
    app.include_router(market.router)

    if WEB_DIR.exists():
        app.mount("/assets", StaticFiles(directory=WEB_DIR / "assets"), name="web-assets")

        @app.get("/{path:path}", include_in_schema=False)
        async def spa(path: str):
            if path.startswith("api/"):
                return JSONResponse({"detail": "Not found"}, status_code=404)
            file = (WEB_DIR / path).resolve()
            if path and file.is_file() and WEB_DIR in file.parents:
                return FileResponse(file)
            return FileResponse(WEB_DIR / "index.html")

    return app
