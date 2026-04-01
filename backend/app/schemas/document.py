from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    chunk_count: Optional[int]
    error_message: Optional[str]
    project_id: Optional[str]
    uploaded_by: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    message: str


class DocumentSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    project_id: Optional[str] = None


class DocumentChunkResult(BaseModel):
    document_id: str
    document_name: str
    content: str
    score: float
    chunk_index: int
