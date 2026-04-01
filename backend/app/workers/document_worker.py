import asyncio
from app.workers.celery_app import celery_app
from app.core.logging import get_logger

logger = get_logger(__name__)


@celery_app.task(
    bind=True,
    name="app.workers.document_worker.process_document",
    max_retries=3,
    default_retry_delay=60,
)
def process_document(self, document_id: str) -> dict:
    """
    Background task to process a document:
    1. Download from S3
    2. Extract text
    3. Chunk and embed
    4. Update document status in DB
    """
    try:
        return asyncio.get_event_loop().run_until_complete(
            _process_document_async(document_id)
        )
    except Exception as exc:
        logger.error("document_worker_failed", doc_id=document_id, error=str(exc))
        raise self.retry(exc=exc)


async def _process_document_async(document_id: str) -> dict:
    from app.db.session import AsyncSessionLocal
    from app.models.document import Document, DocumentStatus
    from app.services.storage_service import storage_service
    from app.services.embedding_service import embedding_service
    from app.services.document_service import extract_text
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if not document:
            return {"error": f"Document {document_id} not found"}

        try:
            document.status = DocumentStatus.PROCESSING
            await db.flush()

            content = await storage_service.download_file(document.s3_key)
            extracted_text = extract_text(content, document.file_type)

            chunk_count = await embedding_service.add_document(
                document_id=document_id,
                text=extracted_text,
            )

            document.extracted_text = extracted_text
            document.chunk_count = chunk_count
            document.status = DocumentStatus.PROCESSED
            await db.commit()

            logger.info("document_processed_by_worker", doc_id=document_id, chunks=chunk_count)
            return {"status": "processed", "chunks": chunk_count}

        except Exception as e:
            document.status = DocumentStatus.FAILED
            document.error_message = str(e)
            await db.commit()
            raise
