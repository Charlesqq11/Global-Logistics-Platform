from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CustomerPortalTrackingEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    title: str
    description: str | None = None
    location: str | None = None
    country_code: str | None = None
    event_time: datetime


class CustomerPortalShipmentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tracking_number: str
    shipment_type: str
    status: str

    origin_country: str
    origin_city: str | None = None

    destination_country: str
    destination_city: str | None = None

    estimated_delivery_at: datetime | None = None
    delivered_at: datetime | None = None

    created_at: datetime


class CustomerPortalShipmentDetail(
    CustomerPortalShipmentSummary
):
    description: str | None = None

    weight_kg: Decimal | None = None

    declared_value: Decimal | None = None
    declared_currency: str | None = None

    tracking_events: list[
        CustomerPortalTrackingEvent
    ] = []


class CustomerPortalDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_type: str
    file_name: str
    mime_type: str
    uploaded_at: datetime
class CustomerPortalPaymentProofResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    payment_request_id: UUID
    original_filename: str
    mime_type: str
    size_bytes: int
    status: str
    rejection_reason: str | None = None
    submitted_at: datetime
    reviewed_at: datetime | None = None


class CustomerPortalPaymentRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customs_case_id: UUID
    reference: str
    description: str
    amount: Decimal
    currency: str
    status: str
    provider: str
    due_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    bank_name_snapshot: str | None = None
    account_name_snapshot: str | None = None
    account_number_snapshot: str | None = None
    bank_currency_snapshot: str | None = None
    transfer_instructions_snapshot: str | None = None
    proofs: list[CustomerPortalPaymentProofResponse] = []


class CustomerPortalPaymentProofResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    payment_request_id: UUID
    original_filename: str
    mime_type: str
    size_bytes: int
    status: str
    rejection_reason: str | None = None
    submitted_at: datetime
    reviewed_at: datetime | None = None
