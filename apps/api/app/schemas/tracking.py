from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PublicTrackingEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    title: str
    description: str | None = None
    location: str | None = None
    country_code: str | None = None
    event_time: datetime


class PublicCustomsStatus(BaseModel):
    status: str
    customs_reference: str | None = None
    required_action: str | None = None


class PublicPaymentRequirement(BaseModel):
    reference: str
    description: str
    amount: Decimal
    currency: str
    status: str
    due_at: datetime | None = None


class PublicTrackingResponse(BaseModel):
    tracking_number: str
    shipment_type: str
    status: str

    origin_country: str
    origin_city: str | None = None

    destination_country: str
    destination_city: str | None = None

    description: str | None = None

    weight_kg: Decimal | None = None
    declared_value: Decimal | None = None
    declared_currency: str | None = None

    estimated_delivery_at: datetime | None = None
    delivered_at: datetime | None = None

    tracking_events: list[PublicTrackingEvent]

    customs: PublicCustomsStatus | None = None

    payment_required: PublicPaymentRequirement | None = None