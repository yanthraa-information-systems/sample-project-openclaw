import os
import pickle
import numpy as np
from typing import List, Tuple, Optional
import faiss
import asyncio
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.exceptions import AIServiceError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Chunk parameters
CHUNK_SIZE = 512
CHUNK_OVERLAP = 50


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        if end == len(words):
            break
        start += chunk_size - overlap
    return chunks


class EmbeddingService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._index: Optional[faiss.IndexFlatIP] = None
        self._metadata: List[dict] = []  # [{doc_id, chunk_index, text}]
        self._index_path = settings.faiss_index_path
        self._load_index()

    def _load_index(self) -> None:
        index_file = f"{self._index_path}.index"
        meta_file = f"{self._index_path}.meta"
        if os.path.exists(index_file) and os.path.exists(meta_file):
            try:
                self._index = faiss.read_index(index_file)
                with open(meta_file, "rb") as f:
                    self._metadata = pickle.load(f)
                logger.info("faiss_index_loaded", vector_count=self._index.ntotal)
            except Exception as e:
                logger.warning("faiss_index_load_failed", error=str(e))
                self._init_empty_index()
        else:
            self._init_empty_index()

    def _init_empty_index(self) -> None:
        self._index = faiss.IndexFlatIP(settings.embedding_dimension)
        self._metadata = []

    def _save_index(self) -> None:
        os.makedirs(os.path.dirname(self._index_path) if os.path.dirname(self._index_path) else ".", exist_ok=True)
        faiss.write_index(self._index, f"{self._index_path}.index")
        with open(f"{self._index_path}.meta", "wb") as f:
            pickle.dump(self._metadata, f)

    async def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Get embeddings for a list of texts."""
        try:
            response = await self.client.embeddings.create(
                model=settings.openai_embedding_model,
                input=texts,
            )
            embeddings = np.array(
                [item.embedding for item in response.data], dtype=np.float32
            )
            # Normalize for cosine similarity via inner product
            faiss.normalize_L2(embeddings)
            return embeddings
        except Exception as e:
            logger.error("embedding_failed", error=str(e))
            raise AIServiceError(f"Embedding generation failed: {str(e)}")

    async def add_document(
        self, document_id: str, text: str
    ) -> int:
        """Chunk, embed and index a document. Returns chunk count."""
        chunks = chunk_text(text)
        if not chunks:
            return 0

        embeddings = await self.embed_texts(chunks)

        start_idx = len(self._metadata)
        for i, chunk in enumerate(chunks):
            self._metadata.append({
                "document_id": document_id,
                "chunk_index": i,
                "text": chunk,
            })

        self._index.add(embeddings)
        self._save_index()
        logger.info("document_indexed", doc_id=document_id, chunks=len(chunks))
        return len(chunks)

    async def search(
        self, query: str, top_k: int = 5, document_ids: Optional[List[str]] = None
    ) -> List[Tuple[dict, float]]:
        """Search for similar chunks. Returns [(metadata, score)]."""
        if self._index.ntotal == 0:
            return []

        query_embedding = await self.embed_texts([query])
        scores, indices = self._index.search(query_embedding, min(top_k * 3, self._index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._metadata):
                continue
            meta = self._metadata[idx]
            if document_ids and meta["document_id"] not in document_ids:
                continue
            results.append((meta, float(score)))
            if len(results) >= top_k:
                break

        return results

    async def remove_document(self, document_id: str) -> None:
        """Remove all chunks for a document from the index."""
        # FAISS FlatIndex doesn't support deletion — rebuild without those chunks
        remaining_meta = [m for m in self._metadata if m["document_id"] != document_id]
        if len(remaining_meta) == len(self._metadata):
            return  # Nothing to remove

        remaining_texts = [m["text"] for m in remaining_meta]
        self._init_empty_index()
        self._metadata = []

        if remaining_texts:
            embeddings = await self.embed_texts(remaining_texts)
            self._index.add(embeddings)
            self._metadata = remaining_meta

        self._save_index()
        logger.info("document_removed_from_index", doc_id=document_id)


embedding_service = EmbeddingService()
