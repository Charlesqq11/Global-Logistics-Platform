from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.bank_account import BankAccount
from app.models.customs import CustomsCase, CustomsStatus
from app.models.payment import (
    Payment,
    PaymentProvider,
    PaymentRequest,
    PaymentRequestStatus,
)
from app.services.customs import update_customs_status


def create_payment_request(
    db: Session,
    customs_case: CustomsCase,
    description: str,
    amount: Decimal,
    currency: str,
    provider: PaymentProvider = PaymentProvider.MANUAL,
    due_at: datetime | None = None,
    bank_account_id: UUID | None = None,
) -> PaymentRequest:
    if amount <= 0:
        raise ValueError(
            "Payment amount must be greater than zero."
        )

    currency = currency.upper().strip()

    if len(currency) != 3:
        raise ValueError(
            "Currency must be a valid 3-letter code."
        )

    if customs_case.status not in {
        CustomsStatus.PAYMENT_REQUIRED,
        CustomsStatus.ON_HOLD,
        CustomsStatus.UNDER_CLEARANCE,
    }:
        raise ValueError(
            "A payment request cannot be created for "
            "the current customs status."
        )

    if not description.strip():
        raise ValueError(
            "Payment description is required."
        )

    bank_account = None

    if bank_account_id is not None:
        bank_account = db.get(BankAccount, bank_account_id)

        if bank_account is None or not bank_account.is_active:
            raise ValueError(
                "The selected bank account does not exist or is inactive."
            )

        if bank_account.currency.upper().strip() != currency:
            raise ValueError(
                "The selected bank account currency must match "
                "the payment request currency."
            )

    reference = f"PAY-{uuid4().hex[:12].upper()}"

    payment_request = PaymentRequest(
        customs_case_id=customs_case.id,
        reference=reference,
        description=description.strip(),
        amount=amount,
        currency=currency,
        status=PaymentRequestStatus.PENDING,
        provider=provider,
        due_at=due_at,
        bank_account_id=(bank_account.id if bank_account else None),
        bank_name_snapshot=(bank_account.bank_name if bank_account else None),
        account_name_snapshot=(bank_account.account_name if bank_account else None),
        account_number_snapshot=(bank_account.account_number if bank_account else None),
        bank_currency_snapshot=(bank_account.currency if bank_account else None),
        transfer_instructions_snapshot=(
            bank_account.transfer_instructions if bank_account else None
        ),
    )

    db.add(payment_request)

    customs_case.status = CustomsStatus.PAYMENT_REQUIRED

    db.commit()
    db.refresh(payment_request)

    return payment_request


def mark_payment_request_paid(
    db: Session,
    payment_request: PaymentRequest,
    provider_transaction_id: str | None = None,
) -> Payment:
    if payment_request.status == PaymentRequestStatus.PAID:
        raise ValueError(
            "This payment request has already been paid."
        )

    if payment_request.status in {
        PaymentRequestStatus.CANCELLED,
        PaymentRequestStatus.EXPIRED,
    }:
        raise ValueError(
            "This payment request is no longer payable."
        )

    transaction_id = (
        provider_transaction_id.strip()
        if provider_transaction_id
        else None
    )

    if transaction_id == "":
        transaction_id = None

    payment = Payment(
        payment_request_id=payment_request.id,
        provider=payment_request.provider,
        provider_transaction_id=transaction_id,
        amount=payment_request.amount,
        currency=payment_request.currency,
        status=PaymentRequestStatus.PAID,
        paid_at=datetime.now(timezone.utc),
    )

    payment_request.status = PaymentRequestStatus.PAID

    db.add(payment)

    db.flush()

    try:
        update_customs_status(
            db=db,
            customs_case=payment_request.customs_case,
            new_status=CustomsStatus.CLEARED,
        )
    except ValueError:
        db.rollback()
        raise

    db.refresh(payment)

    return payment


def cancel_payment_request(
    db: Session,
    payment_request: PaymentRequest,
) -> PaymentRequest:
    if payment_request.status == PaymentRequestStatus.PAID:
        raise ValueError(
            "A paid payment request cannot be cancelled."
        )

    if payment_request.status == PaymentRequestStatus.CANCELLED:
        raise ValueError(
            "This payment request is already cancelled."
        )

    if payment_request.status == PaymentRequestStatus.EXPIRED:
        raise ValueError(
            "An expired payment request cannot be cancelled."
        )

    payment_request.status = PaymentRequestStatus.CANCELLED

    db.commit()
    db.refresh(payment_request)

    return payment_request