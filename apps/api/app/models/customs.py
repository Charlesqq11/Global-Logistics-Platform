from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CustomsStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    PENDING_REVIEW = "pending_review"
    UNDER_CLEARANCE = "under_clearance"
    INFORMATION_REQUIRED = "information_required"
    PAYMENT_REQUIRED = "payment_required"
    ON_HOLD = "on_hold"
    CLEARED = "cleared"
    REJECTED = "rejected"


class CustomsCase(Base):
    __tablename__ = "customs_cases"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    shipment_id: Mapped[UUID] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    status: Mapped[CustomsStatus] = mapped_column(
        String(50),
        default=CustomsStatus.PENDING_REVIEW,
        index=True,
        nullable=False,
    )

    customs_reference: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
    )

    hold_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    required_action: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    authority_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    internal_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    cleared_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    shipment: Mapped["Shipment"] = relationship(
        back_populates="customs_case",
    )

    payment_requests: Mapped[list["PaymentRequest"]] = relationship(
        back_populates="customs_case",
        cascade="all, delete-orphan",
    )