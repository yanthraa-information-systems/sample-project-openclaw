import asyncio
from app.workers.celery_app import celery_app
from app.core.logging import get_logger

logger = get_logger(__name__)


@celery_app.task(
    bind=True,
    name="app.workers.embedding_worker.reindex_document",
    max_retries=2,
    default_retry_delay=30,
)
def reindex_document(self, document_id: str) -> dict:
    """Re-generate and re-index embeddings for a document."""
    try:
        return asyncio.get_event_loop().run_until_complete(
            _reindex_async(document_id)
        )
    except Exception as exc:
        logger.error("reindex_failed", doc_id=document_id, error=str(exc))
        raise self.retry(exc=exc)


async def _reindex_async(document_id: str) -> dict:
    from app.db.session import AsyncSessionLocal
    from app.models.document import Document, DocumentStatus
    from app.services.embedding_service import embedding_service
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()

        if not document or not document.extracted_text:
            return {"error": "Document not found or has no extracted text"}

        await embedding_service.remove_document(document_id)
        chunk_count = await embedding_service.add_document(
            document_id=document_id,
            text=document.extracted_text,
        )

        document.chunk_count = chunk_count
        await db.commit()

        logger.info("document_reindexed", doc_id=document_id, chunks=chunk_count)
        return {"status": "reindexed", "chunks": chunk_count}
