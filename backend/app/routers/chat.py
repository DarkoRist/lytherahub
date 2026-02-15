"""Chat router — conversational AI assistant endpoint."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.models.database import User, get_db
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    page_context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    actions: Optional[list[dict]] = None
    chart_data: Optional[dict] = None


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the AI chat assistant."""
    session_id = body.session_id or str(uuid.uuid4())

    result = await chat_service.chat(
        user=user,
        db=db,
        message=body.message,
        session_id=session_id,
        page_context=body.page_context,
    )

    return ChatResponse(
        reply=result.get("reply", ""),
        session_id=session_id,
        actions=result.get("actions"),
        chart_data=result.get("chart_data"),
    )
