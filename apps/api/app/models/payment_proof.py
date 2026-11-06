from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PaymentProofStatus(str, Enum):
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class PaymentProof(Base):
    __tablename__ = "payment_proofs"

    __table_args__ = (
        CheckConstraint("size_bytes > 0", name="ck_payment_proofs_size_positive"),
    )

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    payment_request_id: Mapped[UUID] = mapped_column(
        ForeignKey("payment_requests.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    storage_key: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    size_bytes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[PaymentProofStatus] = mapped_column(
        String(30),
        default=PaymentProofStatus.SUBMITTED,
        index=True,
        nullable=False,
    )

    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    reviewed_by_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    payment_request: Mapped["PaymentRequest"] = relationship(
        back_populates="payment_proofs",
    )

    reviewed_by: Mapped["User | None"] = relationship(
        foreign_keys=[reviewed_by_user_id],
    )
