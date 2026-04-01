import re
from typing import Optional


def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_username(username: str) -> bool:
    return bool(re.match(r'^[a-zA-Z0-9_-]{3,50}$', username))


def sanitize_filename(filename: str) -> str:
    """Remove or replace unsafe characters from filename."""
    # Remove path separators and null bytes
    filename = filename.replace('/', '_').replace('\\', '_').replace('\x00', '')
    # Keep only safe characters
    safe = re.sub(r'[^\w\s\-.]', '_', filename)
    return safe.strip()[:255]
