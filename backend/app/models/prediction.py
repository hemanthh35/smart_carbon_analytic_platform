"""Prediction ORM model."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    facility_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Unknown")
    country: Mapped[str] = mapped_column(String(100), nullable=True)
    predicted_emission: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_emission: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="predictions")  # noqa: F821
    carbon_credits: Mapped[list["CarbonCredit"]] = relationship(  # noqa: F821
        "CarbonCredit", back_populates="prediction", cascade="all, delete-orphan"
    )
