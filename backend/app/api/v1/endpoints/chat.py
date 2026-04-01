import math
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionResponse,
    ChatMessageResponse, SendMessageRequest,
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.chat_service import ChatService
from app.api.deps import CurrentUser, DBSession
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(data: ChatSessionCreate, current_user: CurrentUser, db: DBSession):
    service = ChatService(db)
    return await service.create_session(data, current_user)


@router.get("/sessions", response_model=PaginatedResponse[ChatSessionResponse])
async def list_sessions(
    current_user: CurrentUser, db: DBSession,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    service = ChatService(db)
    sessions, total = await service.list_sessions(current_user, page=page, page_size=page_size)
    return PaginatedResponse(
        items=sessions, total=total, page=page,
        page_size=page_size, pages=math.ceil(total / page_size),
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(session_id: str, current_user: CurrentUser, db: DBSession):
    service = ChatService(db)
    return await service.get_session(session_id, current_user)


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def delete_session(session_id: str, current_user: CurrentUser, db: DBSession):
    service = ChatService(db)
    await service.delete_session(session_id, current_user)
    return MessageResponse(message="Chat session deleted")


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(
    session_id: str, current_user: CurrentUser, db: DBSession,
    limit: int = Query(50, ge=1, le=200),
):
    service = ChatService(db)
    return await service.get_messages(session_id, current_user, limit=limit)


@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str, request: SendMessageRequest,
    current_user: CurrentUser, db: DBSession,
):
    service = ChatService(db)
    return StreamingResponse(
        service.send_message_stream(session_id, request, current_user),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
