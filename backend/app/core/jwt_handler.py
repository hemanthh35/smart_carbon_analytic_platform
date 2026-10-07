"""JWT creation and decoding utilities."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings
from app.utils.constants import TokenTypes


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    payload.update(
        {
            "type": TokenTypes.ACCESS,
            "exp": _now() + timedelta(minutes=settings.access_token_expire_minutes),
            "iat": _now(),
        }
    )
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    payload.update(
        {
            "type": TokenTypes.REFRESH,
            "exp": _now() + timedelta(days=settings.refresh_token_expire_days),
            "iat": _now(),
        }
    )
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on invalid/expired tokens."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
