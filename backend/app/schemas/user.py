"""User schemas."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=128)
    email: EmailStr | None = None


class UserListResponse(BaseModel):
    total: int
    users: list[UserOut]
