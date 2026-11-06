from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.customs import CustomsCase, CustomsStatus
from app.models.shipment import Shipment
from app.services.customs import (
    get_customs_case,
    open_customs_case,
    update_customs_status,
)

from app.schemas.customs import (
    CustomsCaseCreate,
    CustomsStatusUpdate,
)

router = APIRouter(
    prefix="/admin/customs",
    tags=["Admin Customs"],
)

@router.get("")
def list_admin_customs_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customs.manage")
    ),
):
    statement = (
        select(CustomsCase)
        .join(
            Shipment,
            CustomsCase.shipment_id == Shipment.id,
        )
        .where(
            Shipment.archived_at.is_(None),
        )
        .options(
            selectinload(CustomsCase.shipment),
        )
        .order_by(
            CustomsCase.updated_at.desc()
        )
    )

    return db.scalars(statement).unique().all()

@router.post("/{shipment_id}")
def create_customs_case(
    shipment_id: UUID,
    payload: CustomsCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customs.manage")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    try:
        customs_case = open_customs_case(
            db=db,
            shipment=shipment,
            customs_reference=payload.customs_reference,
            authority_name=payload.authority_name,
            required_action=payload.required_action,
            internal_notes=payload.internal_notes,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return customs_case

@router.get("/{shipment_id}")
def get_admin_customs_case(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customs.manage")
    ),
):
    customs_case = get_customs_case(
        db=db,
        shipment_id=shipment_id,
    )

    if customs_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customs case not found.",
        )

    return customs_case


@router.patch("/{shipment_id}/status")
def change_customs_status(
    shipment_id: UUID,
    payload: CustomsStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("customs.manage")
    ),
):
    customs_case = get_customs_case(
        db=db,
        shipment_id=shipment_id,
    )

    if customs_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customs case not found.",
        )

    customs_case = update_customs_status(
        db=db,
        customs_case=customs_case,
        new_status=payload.status,
        hold_reason=payload.hold_reason,
        required_action=payload.required_action,
    )

    return customs_case