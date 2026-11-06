from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment import PaymentRequestStatus
from app.schemas.tracking import PublicTrackingResponse
from app.services.tracking import get_public_tracking
from app.services.visitor_analytics import record_tracking_visit


router = APIRouter(
    prefix="/tracking",
    tags=["Public Tracking"],
)


@router.get(
    "/{tracking_number}",
    response_model=PublicTrackingResponse,
)
def track_shipment(
    tracking_number: str,
    request: Request,
    db: Session = Depends(get_db),
) -> PublicTrackingResponse:
    shipment = get_public_tracking(
        db=db,
        tracking_number=tracking_number.strip(),
    )

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    # Record successful tracking visits.
    # Analytics failures must not interrupt customer tracking.
    record_tracking_visit(
        db=db,
        request=request,
        shipment=shipment,
    )

    customs = None

    if shipment.customs_case is not None:
        customs = {
            "status": shipment.customs_case.status,
            "customs_reference": shipment.customs_case.customs_reference,
            "required_action": shipment.customs_case.required_action,
        }

    payment_required = None

    if shipment.customs_case is not None:
        payment_required = next(
            (
                {
                    "reference": payment.reference,
                    "description": payment.description,
                    "amount": payment.amount,
                    "currency": payment.currency,
                    "status": payment.status,
                    "due_at": payment.due_at,
                }
                for payment in shipment.customs_case.payment_requests
                if payment.status != PaymentRequestStatus.PAID
            ),
            None,
        )

    return PublicTrackingResponse(
        tracking_number=shipment.tracking_number,
        shipment_type=shipment.shipment_type,
        status=shipment.status,
        origin_country=shipment.origin_country,
        origin_city=shipment.origin_city,
        destination_country=shipment.destination_country,
        destination_city=shipment.destination_city,
        description=shipment.description,
        weight_kg=shipment.weight_kg,
        declared_value=shipment.declared_value,
        declared_currency=shipment.declared_currency,
        estimated_delivery_at=shipment.estimated_delivery_at,
        delivered_at=shipment.delivered_at,
        tracking_events=shipment.tracking_events,
        customs=customs,
        payment_required=payment_required,
    )