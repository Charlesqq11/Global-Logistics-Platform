from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    bank_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    account_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    account_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        index=True,
        nullable=False,
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    bank_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    swift_code: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    iban: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    transfer_instructions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
