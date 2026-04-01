from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ai_platform",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.document_worker", "app.workers.embedding_worker"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.document_worker.*": {"queue": "documents"},
        "app.workers.embedding_worker.*": {"queue": "embeddings"},
    },
)
