from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document, DocumentStatus
from app.services.embedding_service import embedding_service
from app.schemas.document import DocumentChunkResult
from app.core.logging import get_logger

logger = get_logger(__name__)

RAG_CONTEXT_TEMPLATE = """Use the following document excerpts to help answer the question.
If the information isn't in the documents, say so clearly.

{context}

---
Question: {query}
"""


class RAGService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def retrieve_context(
        self,
        query: str,
        project_id: Optional[str] = None,
        top_k: int = 5,
    ) -> List[DocumentChunkResult]:
        document_ids: Optional[List[str]] = None
        if project_id:
            result = await self.db.execute(
                select(Document.id).where(
                    Document.project_id == project_id,
                    Document.status == DocumentStatus.PROCESSED.value,
                )
            )
            document_ids = [str(doc_id) for doc_id in result.scalars().all()]
            if not document_ids:
                return []

        results = await embedding_service.search(
            query=query, top_k=top_k, document_ids=document_ids
        )

        chunks = []
        for meta, score in results:
            doc_result = await self.db.execute(
                select(Document).where(Document.id == meta["document_id"])
            )
            doc = doc_result.scalar_one_or_none()
            if doc:
                chunks.append(
                    DocumentChunkResult(
                        document_id=doc.id,
                        document_name=doc.original_filename,
                        content=meta["text"],
                        score=score,
                        chunk_index=meta["chunk_index"],
                    )
                )

        return chunks

    def build_rag_prompt(self, query: str, chunks: List[DocumentChunkResult]) -> str:
        if not chunks:
            return query
        context = "\n\n".join(
            f"[Document: {c.document_name}, Section {c.chunk_index + 1}]\n{c.content}"
            for c in chunks
        )
        return RAG_CONTEXT_TEMPLATE.format(context=context, query=query)
