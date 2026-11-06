from __future__ import annotations

from app.models.customs import CustomsStatus
from pydantic import BaseModel, Field


class CustomsCaseCreate(BaseModel):
    customs_reference: str | None = Field(
        default=None,
        max_length=100,
    )

    authority_name: str | None = Field(
        default=None,
        max_length=255,
    )

    required_action: str | None = None

    internal_notes: str | None = None


class CustomsStatusUpdate(BaseModel):
    status: CustomsStatus

    hold_reason: str | None = None

    required_action: str | None = None


class CustomsCaseResponse(BaseModel):
    id: str
    shipment_id: str
    status: CustomsStatus
    customs_reference: str | None
    hold_reason: str | None
    required_action: str | None
    authority_name: str | None
    opened_at: str
    cleared_at: str | None
    created_at: str
    updated_at: str

    model_config = {
        "from_attributes": True,
    }