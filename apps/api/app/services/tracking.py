from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.shipment import Shipment
from app.models.customs import CustomsCase


def get_public_tracking(
    db: Session,
    tracking_number: str,
) -> Shipment | None:
    statement = (
        select(Shipment)
        .where(
            Shipment.tracking_number == tracking_number
        )
        .options(
            selectinload(Shipment.tracking_events),
            selectinload(Shipment.customs_case)
            .selectinload(CustomsCase.payment_requests),
        )
    )

    shipment = db.scalar(statement)

    if shipment is not None:
        shipment.tracking_events.sort(
            key=lambda event: event.event_time,
            reverse=True,
        )

    return shipment