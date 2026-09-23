from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api")


class SettingsUpdate(BaseModel):
    currency: Literal["USD", "EUR"] | None = None


@router.get("/health")
async def health():
    return {"ok": True, "paper_only": True}


@router.get("/settings")
async def get_settings(request: Request):
    return request.app.state.db.get_settings()


@router.put("/settings")
async def put_settings(request: Request, update: SettingsUpdate):
    values = update.model_dump(exclude_none=True)
    return request.app.state.db.update_settings(values)
