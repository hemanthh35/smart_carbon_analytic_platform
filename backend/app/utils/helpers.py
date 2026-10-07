"""Utility helper functions."""
from __future__ import annotations

import math
from datetime import datetime
from typing import Any


def paginate(query, page: int, page_size: int):
    """Apply offset/limit pagination to a SQLAlchemy query."""
    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size)


def format_datetime(dt: datetime | None) -> str | None:
    """Format a datetime object to ISO 8601 string."""
    if dt is None:
        return None
    return dt.isoformat()


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers, returning default if denominator is zero."""
    if denominator == 0:
        return default
    return numerator / denominator


def round_or_none(value: Any, ndigits: int = 4) -> float | None:
    """Round a float value or return None if not numeric."""
    try:
        return round(float(value), ndigits)
    except (TypeError, ValueError):
        return None


def get_client_ip(request) -> str:
    """Extract real client IP from request headers or client info."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"
