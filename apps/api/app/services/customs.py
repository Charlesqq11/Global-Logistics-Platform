from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customs import (
    CustomsCase,
    CustomsStatus,
)
from app.models.payment import (
    PaymentRequest,
    PaymentRequestStatus,
)
from app.models.shipment import (
    Shipment,
    ShipmentStatus,
)
from app.models.tracking import TrackingEvent


def get_customs_case(
    db: Session,
    shipment_id: UUID,
) -> CustomsCase | None:
    return db.scalar(
        select(CustomsCase).where(
            CustomsCase.shipment_id == shipment_id
        )
    )


def open_customs_case(
    db: Session,
    shipment: Shipment,
    customs_reference: str | None = None,
    authority_name: str | None = None,
    required_action: str | None = None,
    internal_notes: str | None = None,
) -> CustomsCase:
    existing_case = get_customs_case(
        db,
        shipment.id,
    )

    if existing_case is not None:
        raise ValueError(
            "A customs case already exists for this shipment."
        )

    customs_case = CustomsCase(
        shipment_id=shipment.id,
        status=CustomsStatus.PENDING_REVIEW,
        customs_reference=customs_reference,
        authority_name=authority_name,
        required_action=required_action,
        internal_notes=internal_notes,
        opened_at=datetime.now(timezone.utc),
    )

    shipment.status = ShipmentStatus.CUSTOMS_CLEARANCE
    shipment.updated_at = datetime.now(timezone.utc)

    db.add(customs_case)
    db.commit()
    db.refresh(customs_case)

    return customs_case


def update_customs_status(
    db: Session,
    customs_case: CustomsCase,
    new_status: CustomsStatus,
    hold_reason: str | None = None,
    required_action: str | None = None,
) -> CustomsCase:
    if new_status == CustomsStatus.CLEARED:
        payment_requests = db.scalars(
            select(PaymentRequest).where(
                PaymentRequest.customs_case_id
                == customs_case.id
            )
        ).all()

        unpaid_requests = [
            request
            for request in payment_requests
            if request.status
            != PaymentRequestStatus.PAID
        ]

        if unpaid_requests:
            raise ValueError(
                "Customs cannot be cleared while a "
                "payment request is unpaid."
            )

    now = datetime.now(timezone.utc)

    customs_case.status = new_status

    if hold_reason is not None:
        customs_case.hold_reason = hold_reason

    if required_action is not None:
        customs_case.required_action = required_action

    if new_status != CustomsStatus.ON_HOLD:
        customs_case.hold_reason = None

    if new_status == CustomsStatus.CLEARED:
        customs_case.cleared_at = now
        customs_case.required_action = None

        customs_case.shipment.status = (
            ShipmentStatus.CUSTOMS_CLEARED
        )

        customs_case.shipment.updated_at = now

        tracking_event = TrackingEvent(
            shipment_id=customs_case.shipment.id,
            status=ShipmentStatus.CUSTOMS_CLEARED.value,
            title="Customs cleared",
            description=(
                "Shipment has successfully cleared customs "
                "and is ready to continue in transit."
            ),
            event_time=now,
        )

        db.add(tracking_event)

    elif new_status == CustomsStatus.ON_HOLD:
        customs_case.shipment.status = (
            ShipmentStatus.CUSTOMS_HOLD
        )

        customs_case.shipment.updated_at = now

    elif new_status == CustomsStatus.UNDER_CLEARANCE:
        customs_case.shipment.status = (
            ShipmentStatus.CUSTOMS_CLEARANCE
        )

        customs_case.shipment.updated_at = now

    elif new_status == CustomsStatus.PAYMENT_REQUIRED:
        customs_case.shipment.status = (
            ShipmentStatus.CUSTOMS_HOLD
        )

        customs_case.shipment.updated_at = now

    elif new_status == CustomsStatus.INFORMATION_REQUIRED:
        customs_case.shipment.status = (
            ShipmentStatus.CUSTOMS_HOLD
        )

        customs_case.shipment.updated_at = now

    elif new_status == CustomsStatus.REJECTED:
        customs_case.shipment.status = (
            ShipmentStatus.ON_HOLD
        )

        customs_case.shipment.updated_at = now

    elif new_status == CustomsStatus.NOT_REQUIRED:
        customs_case.shipment.status = (
            ShipmentStatus.IN_TRANSIT
        )

        customs_case.shipment.updated_at = now

    db.commit()
    db.refresh(customs_case)

    return customs_case