import uuid
import json
from typing import List, Optional, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from openai import AsyncOpenAI
from app.models.chat import ChatSession, ChatMessage, MessageRole
from app.models.user import User
from app.schemas.chat import ChatSessionCreate, SendMessageRequest
from app.services.rag_service import RAGService
from app.core.config import settings
from app.core.exceptions import NotFoundError, AuthorizationError
from app.core.logging import get_logger

logger = get_logger(__name__)

CONTEXT_WINDOW_MESSAGES = 20


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.openai = AsyncOpenAI(api_key=settings.openai_api_key)
        self.rag_service = RAGService(db)

    async def create_session(self, data: ChatSessionCreate, user: User) -> ChatSession:
        session = ChatSession(
            title=data.title or "New Chat",
            user_id=user.id,
            project_id=data.project_id,
            system_prompt=data.system_prompt,
            model=data.model,
        )
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def get_session(self, session_id: str, user: User) -> ChatSession:
        result = await self.db.execute(
            select(ChatSession).where(ChatSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise NotFoundError("Chat session", session_id)
        if session.user_id != user.id:
            raise AuthorizationError("You do not have access to this chat session")
        return session

    async def list_sessions(
        self, user: User, page: int = 1, page_size: int = 20
    ) -> tuple[List[ChatSession], int]:
        query = select(ChatSession).where(ChatSession.user_id == user.id)
        count_query = select(func.count(ChatSession.id)).where(ChatSession.user_id == user.id)

        total = (await self.db.execute(count_query)).scalar_one()
        offset = (page - 1) * page_size
        sessions = (
            await self.db.execute(
                query.order_by(ChatSession.updated_at.desc()).offset(offset).limit(page_size)
            )
        ).scalars().all()

        return list(sessions), total

    async def get_messages(self, session_id: str, user: User, limit: int = 50) -> List[ChatMessage]:
        await self.get_session(session_id, user)
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        return list(reversed(result.scalars().all()))

    async def _get_context_messages(self, session_id: str) -> List[dict]:
        result = await self.db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(CONTEXT_WINDOW_MESSAGES)
        )
        messages = list(reversed(result.scalars().all()))
        return [{"role": msg.role, "content": msg.content} for msg in messages]

    async def send_message_stream(
        self,
        session_id: str,
        request: SendMessageRequest,
        user: User,
    ) -> AsyncGenerator[str, None]:
        session = await self.get_session(session_id, user)

        user_content = request.content
        if request.use_rag:
            chunks = await self.rag_service.retrieve_context(
                query=request.content,
                project_id=request.project_id or session.project_id,
            )
            if chunks:
                user_content = self.rag_service.build_rag_prompt(request.content, chunks)

        user_message = ChatMessage(
            session_id=session_id,
            role=MessageRole.USER.value,
            content=request.content,
        )
        self.db.add(user_message)
        await self.db.flush()

        messages = [{"role": "system", "content": session.system_prompt or "You are a helpful AI assistant."}]
        context = await self._get_context_messages(session_id)
        for m in context[:-1]:
            messages.append(m)
        messages.append({"role": "user", "content": user_content})

        full_content = ""
        total_tokens = 0
        finish_reason = None
        message_id = str(uuid.uuid4())

        try:
            stream = await self.openai.chat.completions.create(
                model=session.model,
                messages=messages,
                max_tokens=settings.openai_max_tokens,
                stream=True,
            )

            yield f"data: {json.dumps({'type': 'start', 'message_id': message_id})}\n\n"

            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    full_content += delta.content
                    yield f"data: {json.dumps({'type': 'content', 'content': delta.content})}\n\n"
                if chunk.choices and chunk.choices[0].finish_reason:
                    finish_reason = chunk.choices[0].finish_reason
                if hasattr(chunk, "usage") and chunk.usage:
                    total_tokens = chunk.usage.total_tokens

        except Exception as e:
            logger.error("openai_stream_failed", error=str(e), session_id=session_id)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            return

        assistant_message = ChatMessage(
            session_id=session_id,
            role=MessageRole.ASSISTANT.value,
            content=full_content,
            tokens_used=total_tokens,
            model=session.model,
            finish_reason=finish_reason,
        )
        self.db.add(assistant_message)
        session.message_count += 2
        session.total_tokens += total_tokens

        if session.title == "New Chat" and full_content:
            session.title = request.content[:50] + ("..." if len(request.content) > 50 else "")

        await self.db.flush()
        yield f"data: {json.dumps({'type': 'done', 'message_id': str(assistant_message.id), 'tokens_used': total_tokens})}\n\n"

    async def get_total_message_count(self) -> int:
        result = await self.db.execute(select(func.count(ChatMessage.id)))
        return result.scalar_one()

    async def delete_session(self, session_id: str, user: User) -> None:
        session = await self.get_session(session_id, user)
        await self.db.delete(session)
        await self.db.flush()
