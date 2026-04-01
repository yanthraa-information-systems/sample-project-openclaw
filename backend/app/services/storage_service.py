"""
Storage service with two backends:
  - LOCAL  (default): saves files to disk under ./data/uploads/
  - S3: AWS S3 (set AWS_ACCESS_KEY_ID + S3_BUCKET_NAME to enable)
"""
import os
import uuid
import asyncio
import aiofiles
from pathlib import Path
from typing import Optional
from app.core.config import settings
from app.core.exceptions import StorageError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Local upload directory (inside the data/ folder that is gitignored)
LOCAL_UPLOAD_DIR = Path("./data/uploads")


def _use_s3() -> bool:
    return bool(settings.aws_access_key_id and settings.s3_bucket_name)


def _generate_key(user_id: str, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    return f"documents/{user_id}/{uuid.uuid4()}.{ext}"


# ── Local backend ─────────────────────────────────────────────────────────────

async def _local_upload(file_content: bytes, key: str) -> None:
    dest = LOCAL_UPLOAD_DIR / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(dest, "wb") as f:
        await f.write(file_content)


async def _local_download(key: str) -> bytes:
    path = LOCAL_UPLOAD_DIR / key
    if not path.exists():
        raise StorageError(f"File not found: {key}")
    async with aiofiles.open(path, "rb") as f:
        return await f.read()


async def _local_delete(key: str) -> None:
    path = LOCAL_UPLOAD_DIR / key
    if path.exists():
        path.unlink()


def _local_url(key: str) -> str:
    # Return a path the API can serve via /files/{key}
    return f"/files/{key}"


# ── S3 backend ────────────────────────────────────────────────────────────────

def _get_s3_client():
    import boto3
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


async def _s3_upload(file_content: bytes, key: str, content_type: str) -> None:
    from botocore.exceptions import ClientError
    try:
        loop = asyncio.get_event_loop()
        client = _get_s3_client()
        await loop.run_in_executor(
            None,
            lambda: client.put_object(
                Bucket=settings.s3_bucket_name,
                Key=key,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption="AES256",
            ),
        )
    except Exception as e:
        raise StorageError(f"S3 upload failed: {e}")


async def _s3_download(key: str) -> bytes:
    from botocore.exceptions import ClientError
    try:
        loop = asyncio.get_event_loop()
        client = _get_s3_client()
        response = await loop.run_in_executor(
            None,
            lambda: client.get_object(Bucket=settings.s3_bucket_name, Key=key),
        )
        return response["Body"].read()
    except Exception as e:
        raise StorageError(f"S3 download failed: {e}")


async def _s3_delete(key: str) -> None:
    try:
        loop = asyncio.get_event_loop()
        client = _get_s3_client()
        await loop.run_in_executor(
            None,
            lambda: client.delete_object(Bucket=settings.s3_bucket_name, Key=key),
        )
    except Exception as e:
        raise StorageError(f"S3 delete failed: {e}")


async def _s3_presigned_url(key: str) -> str:
    try:
        loop = asyncio.get_event_loop()
        client = _get_s3_client()
        return await loop.run_in_executor(
            None,
            lambda: client.generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.s3_bucket_name, "Key": key},
                ExpiresIn=settings.s3_presigned_url_expiry,
            ),
        )
    except Exception as e:
        raise StorageError(f"S3 presigned URL failed: {e}")


# ── Public API ────────────────────────────────────────────────────────────────

class StorageService:
    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        content_type: str,
        user_id: str,
    ) -> tuple[str, str]:
        """Returns (key, bucket_or_local)."""
        key = _generate_key(user_id, filename)
        if _use_s3():
            await _s3_upload(file_content, key, content_type)
            logger.info("file_uploaded_s3", key=key)
            return key, settings.s3_bucket_name
        else:
            await _local_upload(file_content, key)
            logger.info("file_uploaded_local", key=key)
            return key, "local"

    async def download_file(self, s3_key: str) -> bytes:
        if _use_s3():
            return await _s3_download(s3_key)
        return await _local_download(s3_key)

    async def delete_file(self, s3_key: str) -> None:
        if _use_s3():
            await _s3_delete(s3_key)
        else:
            await _local_delete(s3_key)

    async def get_presigned_url(self, s3_key: str) -> str:
        if _use_s3():
            return await _s3_presigned_url(s3_key)
        # For local storage return a direct API download URL
        return f"/api/v1/documents/serve/{s3_key}"


storage_service = StorageService()
