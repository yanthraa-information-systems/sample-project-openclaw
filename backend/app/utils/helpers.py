import uuid
import math
from typing import TypeVar, Type


def generate_id() -> str:
    return str(uuid.uuid4())


def paginate(total: int, page: int, page_size: int) -> dict:
    pages = math.ceil(total / page_size) if total > 0 else 0
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
    }
