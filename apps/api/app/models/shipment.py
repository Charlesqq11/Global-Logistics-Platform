from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class ShipmentStatus(str, Enum):
    CREATED = "created"

    WAITING_FOR_PICKUP = "waiting_for_pickup"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    PICKUP_FAILED = "pickup_failed"

    RECEIVED = "received"
    PROCESSING = "processing"

    DEPARTED_FACILITY = "departed_facility"
    IN_TRANSIT = "in_transit"
    ARRIVED_AT_FACILITY = "arrived_at_facility"
    ARRIVED_AT_DESTINATION = "arrived_at_destination"

    CUSTOMS_CLEARANCE = "customs_clearance"
    CUSTOMS_INSPECTION = "customs_inspection"
    CUSTOMS_HOLD = "customs_hold"
    CUSTOMS_CLEARED = "customs_cleared"
    RELEASED_FROM_CUSTOMS = "released_from_customs"

    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERY_ATTEMPTED = "delivery_attempted"
    DELIVERY_FAILED = "delivery_failed"
    READY_FOR_COLLECTION = "ready_for_collection"
    DELIVERED = "delivered"

    ON_HOLD = "on_hold"
    DAMAGED = "damaged"
    LOST = "lost"

    RETURNED_TO_SENDER = "returned_to_sender"
    RETURN_DELIVERED = "return_delivered"

    CANCELLED = "cancelled"

class ShipmentType(str, Enum):
    PARCEL = "parcel"
    DOCUMENT = "document"
    FREIGHT = "freight"
    VEHICLE = "vehicle"
    OTHER = "other"


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    tracking_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    customer_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    shipment_type: Mapped[ShipmentType] = mapped_column(
        String(50),
        default=ShipmentType.PARCEL,
        nullable=False,
    )

    status: Mapped[ShipmentStatus] = mapped_column(
        String(50),
        default=ShipmentStatus.CREATED,
        index=True,
        nullable=False,
    )

    origin_country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    origin_city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    destination_country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    destination_city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    weight_kg: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 3),
        nullable=True,
    )

    declared_value: Mapped[Decimal | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
    )

    declared_currency: Mapped[str | None] = mapped_column(
        String(3),
        nullable=True,
    )

    estimated_delivery_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
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

    customer: Mapped["Customer | None"] = relationship(
        back_populates="shipments",
    )

    tracking_events: Mapped[list["TrackingEvent"]] = relationship(
        back_populates="shipment",
        cascade="all, delete-orphan",
    )

    customs_case: Mapped["CustomsCase | None"] = relationship(
        back_populates="shipment",
        uselist=False,
        cascade="all, delete-orphan",
    )

    documents: Mapped[list["ShipmentDocument"]] = relationship(
        back_populates="shipment",
        cascade="all, delete-orphan",
    )