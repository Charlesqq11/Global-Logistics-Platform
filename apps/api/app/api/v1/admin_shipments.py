from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.customs import CustomsCase
from app.models.shipment import Shipment, ShipmentStatus
from app.models.tracking import TrackingEvent
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentCreateResponse,
    ShipmentStatusUpdate,
    ShipmentUpdate,
)
from app.services.shipment import create_shipment
from app.services.shipment_status import validate_status_transition


router = APIRouter(
    prefix="/admin/shipments",
    tags=["Admin Shipments"],
)


@router.post(
    "",
    response_model=ShipmentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_admin_shipment(
    payload: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("shipments.create")
    ),
) -> ShipmentCreateResponse:
    try:
        shipment = create_shipment(
            db=db,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return shipment


@router.get("")
def list_admin_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("shipments.read")
    ),
):
    statement = (
        select(Shipment)
        .where(
            Shipment.archived_at.is_(None)
        )
        .options(
            selectinload(Shipment.customer),
            selectinload(Shipment.tracking_events),
            
        )
        .order_by(Shipment.created_at.desc())
    )

    return db.scalars(statement).unique().all()

@router.get("/{shipment_id}")
def get_admin_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("shipments.read")
    ),
):
    statement = (
        select(Shipment)
        .where(
            Shipment.id == shipment_id,
            Shipment.archived_at.is_(None),
        )
        .options(
            selectinload(Shipment.customer),
            selectinload(Shipment.tracking_events),
            selectinload(Shipment.customs_case),
        )
    )

    shipment = db.scalar(statement)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    return shipment

@router.patch("/{shipment_id}")
def update_admin_shipment(
    shipment_id: str,
    payload: ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("shipments.create")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    if shipment.archived_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Archived shipments cannot be edited.",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    for field, value in updates.items():
        setattr(shipment, field, value)

    shipment.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(shipment)

    return shipment

@router.delete("/{shipment_id}")
def archive_admin_shipment(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("shipments.create")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    if shipment.archived_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shipment is already archived.",
        )

    shipment.archived_at = datetime.now(timezone.utc)
    shipment.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "message": "Shipment archived successfully.",
        "shipment_id": shipment.id,
        "tracking_number": shipment.tracking_number,
        "archived_at": shipment.archived_at,
    }


@router.post("/{shipment_id}/events")
def add_tracking_event(
    shipment_id: str,
    payload: ShipmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("tracking.manage")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    try:
        validate_status_transition(
            ShipmentStatus(shipment.status),
            payload.status,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    shipment.status = payload.status

    if payload.status == ShipmentStatus.DELIVERED:
        shipment.delivered_at = payload.event_time

    event = TrackingEvent(
        shipment_id=shipment.id,
        status=payload.status,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        country_code=payload.country_code,
        event_time=payload.event_time,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Tracking event added successfully.",
        "shipment_id": shipment.id,
        "status": shipment.status,
        "event": event,
    }


@router.post("/{shipment_id}/release-from-customs")
def release_shipment_from_customs(
    shipment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("tracking.manage")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    customs_case = db.scalar(
        select(CustomsCase).where(
            CustomsCase.shipment_id == shipment.id
        )
    )

    if customs_case is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shipment does not have a customs case.",
        )

    if str(customs_case.status) != "cleared":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shipment cannot be released from customs until the customs case is cleared.",
        )

    try:
        current_status = ShipmentStatus(shipment.status)

        validate_status_transition(
            current_status,
            ShipmentStatus.RELEASED_FROM_CUSTOMS,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    shipment.status = ShipmentStatus.RELEASED_FROM_CUSTOMS

    event = TrackingEvent(
        shipment_id=shipment.id,
        status=ShipmentStatus.RELEASED_FROM_CUSTOMS,
        title="Released from customs",
        description=(
            "Shipment has been released from customs "
            "and is ready to continue in transit."
        ),
        event_time=datetime.now(timezone.utc),
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Shipment released from customs successfully.",
        "shipment_id": shipment.id,
        "status": shipment.status,
        "event": event,
    }