from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.customs import CustomsCase
from app.models.payment import (
    PaymentProvider,
    PaymentRequest,
)
from app.services.payment import (
    cancel_payment_request,
    create_payment_request,
    mark_payment_request_paid,
)


router = APIRouter(
    prefix="/admin/payments",
    tags=["Admin Payments"],
)


class PaymentRequestCreate(BaseModel):
    description: str = Field(
        min_length=1,
        max_length=1000,
    )

    amount: Decimal = Field(
        gt=0,
    )

    currency: str = Field(
        min_length=3,
        max_length=3,
    )

    bank_account_id: UUID | None = None

    provider: PaymentProvider = PaymentProvider.MANUAL

    due_at: datetime | None = None


class PaymentMarkPaid(BaseModel):
    provider_transaction_id: str | None = Field(
        default=None,
        max_length=255,
    )


@router.post(
    "/customs/{customs_case_id}",
)
def create_customs_payment_request(
    customs_case_id: UUID,
    payload: PaymentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    customs_case = db.get(
        CustomsCase,
        customs_case_id,
    )

    if customs_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customs case not found.",
        )

    try:
        payment_request = create_payment_request(
            db=db,
            customs_case=customs_case,
            description=payload.description,
            amount=payload.amount,
            currency=payload.currency,
            provider=payload.provider,
            due_at=payload.due_at,
            bank_account_id=payload.bank_account_id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return payment_request


@router.get("")
def list_payment_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    statement = (
        select(PaymentRequest)
        .join(
            CustomsCase,
            PaymentRequest.customs_case_id
            == CustomsCase.id,
        )
        .options(
            selectinload(
                PaymentRequest.customs_case
            ),
            selectinload(
                PaymentRequest.payments
            ),
        )
        .order_by(
            PaymentRequest.created_at.desc()
        )
    )

    return db.scalars(statement).unique().all()


@router.get("/{payment_request_id}")
def get_payment_request(
    payment_request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    statement = (
        select(PaymentRequest)
        .where(
            PaymentRequest.id == payment_request_id
        )
        .options(
            selectinload(
                PaymentRequest.customs_case
            ),
            selectinload(
                PaymentRequest.payments
            ),
        )
    )

    payment_request = db.scalar(statement)

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    return payment_request


@router.post("/{payment_request_id}/paid")
def mark_payment_paid(
    payment_request_id: UUID,
    payload: PaymentMarkPaid,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    payment_request = db.get(
        PaymentRequest,
        payment_request_id,
    )

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    try:
        payment = mark_payment_request_paid(
            db=db,
            payment_request=payment_request,
            provider_transaction_id=(
                payload.provider_transaction_id
            ),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return payment


@router.post("/{payment_request_id}/cancel")
def cancel_payment(
    payment_request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    payment_request = db.get(
        PaymentRequest,
        payment_request_id,
    )

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    try:
        payment_request = cancel_payment_request(
            db=db,
            payment_request=payment_request,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return payment_request