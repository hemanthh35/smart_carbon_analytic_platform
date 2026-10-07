"""Carbon Credit ORM model."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CarbonCredit(Base):
    __tablename__ = "carbon_credits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prediction_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False
    )
    baseline_emission: Mapped[float] = mapped_column(Float, nullable=False)
    predicted_emission: Mapped[float] = mapped_column(Float, nullable=False)
    reduction: Mapped[float] = mapped_column(Float, nullable=False)
    carbon_credits: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    prediction: Mapped["Prediction"] = relationship("Prediction", back_populates="carbon_credits")  # noqa: F821
