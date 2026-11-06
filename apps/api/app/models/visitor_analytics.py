from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TrackingVisit(Base):
    __tablename__ = "tracking_visits"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    shipment_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("shipments.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    tracking_number: Mapped[str] = mapped_column(
        String(100),
        index=True,
        nullable=False,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    country_code: Mapped[str | None] = mapped_column(
        String(2),
        index=True,
        nullable=True,
    )

    region: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(150),
        index=True,
        nullable=True,
    )

    timezone_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    user_agent: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    browser: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    operating_system: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    device_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    visitor_hash: Mapped[str | None] = mapped_column(
        String(64),
        index=True,
        nullable=True,
    )

    visited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
        nullable=False,
    )