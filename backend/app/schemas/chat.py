from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    project_id: Optional[str] = None
    system_prompt: Optional[str] = None
    model: str = "gpt-4-turbo-preview"


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None


class ChatSessionResponse(BaseModel):
    id: str
    title: Optional[str]
    project_id: Optional[str]
    model: str
    message_count: int
    total_tokens: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    tokens_used: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    content: str
    use_rag: bool = False
    project_id: Optional[str] = None


class StreamChunk(BaseModel):
    type: str  # "content", "done", "error"
    content: Optional[str] = None
    message_id: Optional[str] = None
    tokens_used: Optional[int] = None
    error: Optional[str] = None
