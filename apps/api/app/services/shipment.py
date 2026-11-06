from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.shipment import Shipment
from app.models.tracking import TrackingEvent
from app.schemas.shipment import ShipmentCreate


def generate_tracking_number() -> str:
    import secrets

    return f"GLP-{secrets.token_hex(5).upper()}"


def create_shipment(
    db: Session,
    payload: ShipmentCreate,
) -> Shipment:
    if payload.customer_id is not None:
        customer = db.scalar(
            select(Customer).where(
                Customer.id == payload.customer_id
            )
        )

        if customer is None:
            raise ValueError("Customer not found.")

    tracking_number = generate_tracking_number()

    shipment = Shipment(
        tracking_number=tracking_number,
        customer_id=payload.customer_id,
        shipment_type=payload.shipment_type,
        origin_country=payload.origin_country,
        origin_city=payload.origin_city,
        destination_country=payload.destination_country,
        destination_city=payload.destination_city,
        description=payload.description,
        weight_kg=payload.weight_kg,
        declared_value=payload.declared_value,
        declared_currency=payload.declared_currency,
        estimated_delivery_at=payload.estimated_delivery_at,
    )

    db.add(shipment)
    db.flush()

    initial_event = TrackingEvent(
        shipment_id=shipment.id,
        status=shipment.status,
        title="Shipment created",
        description="Shipment record created.",
        location=payload.origin_city,
        country_code=None,
        event_time=shipment.created_at,
    )

    db.add(initial_event)

    db.commit()
    db.refresh(shipment)

    return shipment