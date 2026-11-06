from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.shipment import ShipmentStatus, ShipmentType


class ShipmentCreate(BaseModel):
    customer_id: UUID | None = None

    shipment_type: ShipmentType = ShipmentType.PARCEL

    origin_country: str = Field(min_length=2, max_length=100)
    origin_city: str | None = Field(default=None, max_length=100)

    destination_country: str = Field(min_length=2, max_length=100)
    destination_city: str | None = Field(default=None, max_length=100)

    description: str | None = None

    weight_kg: Decimal | None = Field(default=None, ge=0)
    declared_value: Decimal | None = Field(default=None, ge=0)
    declared_currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
    )

    estimated_delivery_at: datetime | None = None


class ShipmentCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tracking_number: str
    status: ShipmentStatus
    shipment_type: ShipmentType
    created_at: datetime


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    location: str | None = None
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    event_time: datetime

class ShipmentUpdate(BaseModel):
    customer_id: UUID | None = None

    shipment_type: ShipmentType | None = None

    origin_country: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    origin_city: str | None = Field(
        default=None,
        max_length=100,
    )

    destination_country: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    destination_city: str | None = Field(
        default=None,
        max_length=100,
    )

    description: str | None = None

    weight_kg: Decimal | None = Field(
        default=None,
        ge=0,
    )

    declared_value: Decimal | None = Field(
        default=None,
        ge=0,
    )

    declared_currency: str | None = Field(
        default=None,
        min_length=3,
        max_length=3,
    )

    estimated_delivery_at: datetime | None = None