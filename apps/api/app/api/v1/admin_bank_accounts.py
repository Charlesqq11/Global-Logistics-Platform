from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.bank_account import BankAccount
from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountResponse,
    BankAccountUpdate,
)


router = APIRouter(
    prefix="/admin/bank-accounts",
    tags=["Admin Bank Accounts"],
)


def get_bank_account_or_404(
    db: Session,
    bank_account_id: UUID,
) -> BankAccount:
    account = db.get(BankAccount, bank_account_id)

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bank account not found.",
        )

    return account


@router.post(
    "",
    response_model=BankAccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_bank_account(
    payload: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    account = BankAccount(
        bank_name=payload.bank_name,
        account_name=payload.account_name,
        account_number=payload.account_number,
        currency=payload.currency,
        country=payload.country,
        bank_code=payload.bank_code,
        swift_code=payload.swift_code,
        iban=payload.iban,
        transfer_instructions=payload.transfer_instructions,
        is_active=payload.is_active,
    )

    db.add(account)

    try:
        db.commit()
        db.refresh(account)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create the bank account because of a conflicting record.",
        ) from exc

    return account


@router.get(
    "",
    response_model=list[BankAccountResponse],
)
def list_bank_accounts(
    active_only: bool = Query(default=False),
    currency: str | None = Query(default=None, min_length=3, max_length=3),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    statement = select(BankAccount)

    if active_only:
        statement = statement.where(BankAccount.is_active.is_(True))

    if currency:
        statement = statement.where(
            BankAccount.currency == currency.strip().upper()
        )

    statement = statement.order_by(
        BankAccount.currency.asc(),
        BankAccount.bank_name.asc(),
        BankAccount.account_name.asc(),
    )

    return db.scalars(statement).all()


@router.get(
    "/{bank_account_id}",
    response_model=BankAccountResponse,
)
def get_bank_account(
    bank_account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    return get_bank_account_or_404(db, bank_account_id)


@router.patch(
    "/{bank_account_id}",
    response_model=BankAccountResponse,
)
def update_bank_account(
    bank_account_id: UUID,
    payload: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    account = get_bank_account_or_404(db, bank_account_id)
    changes = payload.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update.",
        )

    required_fields = {
        "bank_name",
        "account_name",
        "account_number",
        "currency",
        "is_active",
    }

    for field in required_fields:
        if field in changes and changes[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null.",
            )

    for field, value in changes.items():
        setattr(account, field, value)

    try:
        db.commit()
        db.refresh(account)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not update the bank account because of a conflicting record.",
        ) from exc

    return account


@router.post(
    "/{bank_account_id}/activate",
    response_model=BankAccountResponse,
)
def activate_bank_account(
    bank_account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    account = get_bank_account_or_404(db, bank_account_id)
    account.is_active = True

    db.commit()
    db.refresh(account)

    return account


@router.post(
    "/{bank_account_id}/deactivate",
    response_model=BankAccountResponse,
)
def deactivate_bank_account(
    bank_account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    account = get_bank_account_or_404(db, bank_account_id)
    account.is_active = False

    db.commit()
    db.refresh(account)

    return account
