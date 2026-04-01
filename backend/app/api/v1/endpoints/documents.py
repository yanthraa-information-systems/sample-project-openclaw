import math
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Query
from fastapi.responses import FileResponse
from app.schemas.document import DocumentResponse, DocumentSearchRequest, DocumentChunkResult
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.core.exceptions import NotFoundError
from app.api.deps import CurrentUser, DBSession
from typing import List, Optional

LOCAL_UPLOAD_DIR = Path("./data/uploads")

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    current_user: CurrentUser,
    db: DBSession,
    file: UploadFile = File(...),
    project_id: Optional[str] = Query(None),
):
    """Upload and process a document (PDF, DOCX, or TXT)."""
    service = DocumentService(db)
    return await service.upload(file, current_user, project_id=project_id)


@router.get("", response_model=PaginatedResponse[DocumentResponse])
async def list_documents(
    current_user: CurrentUser, db: DBSession,
    project_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    service = DocumentService(db)
    documents, total = await service.list_for_user(
        current_user, project_id=project_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=documents, total=total, page=page,
        page_size=page_size, pages=math.ceil(total / page_size),
    )


@router.get("/serve/{path:path}")
async def serve_local_file(path: str, current_user: CurrentUser):
    """Serve a locally stored file (used when S3 is not configured)."""
    file_path = LOCAL_UPLOAD_DIR / path
    if not file_path.exists() or not file_path.is_file():
        raise NotFoundError("File", path)
    return FileResponse(str(file_path))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, current_user: CurrentUser, db: DBSession):
    service = DocumentService(db)
    return await service.get_by_id(document_id, current_user)


@router.get("/{document_id}/download-url")
async def get_download_url(document_id: str, current_user: CurrentUser, db: DBSession):
    service = DocumentService(db)
    document = await service.get_by_id(document_id, current_user)
    url = await service.get_presigned_url(document)
    return {"url": url, "expires_in": 3600}


@router.delete("/{document_id}", response_model=MessageResponse)
async def delete_document(document_id: str, current_user: CurrentUser, db: DBSession):
    service = DocumentService(db)
    document = await service.get_by_id(document_id, current_user)
    await service.delete(document, current_user)
    return MessageResponse(message="Document deleted successfully")


@router.post("/search", response_model=List[DocumentChunkResult])
async def search_documents(
    request: DocumentSearchRequest, current_user: CurrentUser, db: DBSession
):
    """Semantic search across processed documents."""
    rag_service = RAGService(db)
    return await rag_service.retrieve_context(
        query=request.query, project_id=request.project_id, top_k=request.top_k,
    )
