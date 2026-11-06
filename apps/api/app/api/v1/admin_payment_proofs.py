from __future__ import annotations

from datetime import datetime, timezone
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.payment import PaymentRequest
from app.models.payment_proof import PaymentProof, PaymentProofStatus
from app.models.customs import CustomsCase
from app.services.payment import mark_payment_request_paid
from app.services.payment_proof_storage import (
    PaymentProofStorageError,
    payment_proof_storage,
)


router = APIRouter(
    prefix="/admin/payment-proofs",
    tags=["Admin Payment Proofs"],
)


class PaymentProofApprove(BaseModel):
    provider_transaction_id: str | None = Field(
        default=None,
        max_length=255,
    )
    admin_notes: str | None = Field(
        default=None,
        max_length=2000,
    )


class PaymentProofReject(BaseModel):
    rejection_reason: str | None = Field(
        default=None,
        max_length=2000,
    )
    admin_notes: str | None = Field(
        default=None,
        max_length=2000,
    )


def payment_proof_query():
    return (
        select(PaymentProof)
        .options(
            selectinload(PaymentProof.payment_request)
            .selectinload(PaymentRequest.customs_case)
            .selectinload(CustomsCase.shipment)
        )
    )


def serialize_payment_proof(proof: PaymentProof) -> dict:
    payment_request = proof.payment_request
    customs_case = payment_request.customs_case

    return {
        "id": proof.id,
        "payment_request_id": payment_request.id,
        "payment_reference": payment_request.reference,
        "amount": payment_request.amount,
        "currency": payment_request.currency,
        "payment_status": payment_request.status,
        "customs_case_id": customs_case.id,
        "shipment_id": customs_case.shipment_id,
        "original_filename": proof.original_filename,
        "mime_type": proof.mime_type,
        "size_bytes": proof.size_bytes,
        "status": proof.status,
        "rejection_reason": proof.rejection_reason,
        "admin_notes": proof.admin_notes,
        "submitted_at": proof.submitted_at,
        "reviewed_at": proof.reviewed_at,
        "reviewed_by_user_id": proof.reviewed_by_user_id,
    }


def get_proof_or_404(
    db: Session,
    proof_id: UUID,
    lock: bool = False,
) -> PaymentProof:
    statement = payment_proof_query().where(
        PaymentProof.id == proof_id
    )

    if lock:
        statement = statement.with_for_update()

    proof = db.scalar(statement)

    if proof is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment proof not found.",
        )

    return proof


@router.get("")
def list_payment_proofs(
    proof_status: PaymentProofStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    statement = payment_proof_query().order_by(
        PaymentProof.submitted_at.desc()
    )

    if proof_status is not None:
        statement = statement.where(
            PaymentProof.status == proof_status
        )

    proofs = db.scalars(statement).unique().all()

    return [
        serialize_payment_proof(proof)
        for proof in proofs
    ]


@router.get("/{proof_id}")
def get_payment_proof(
    proof_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    proof = get_proof_or_404(db, proof_id)

    return serialize_payment_proof(proof)


def serve_payment_proof(
    proof: PaymentProof,
    download: bool,
):
    try:
        file_path = payment_proof_storage.resolve(
            proof.storage_key
        )
    except PaymentProofStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored payment proof is unavailable.",
        ) from exc

    supported_preview_types = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    previewable = proof.mime_type.lower() in supported_preview_types

    if not download and not previewable:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="This file type cannot be previewed.",
        )

    encoded_filename = quote(
        proof.original_filename,
        safe="",
    )

    if download or not previewable:
        disposition = (
            f"attachment; filename*=UTF-8''{encoded_filename}"
        )
        media_type = "application/octet-stream"
    else:
        disposition = (
            f"inline; filename*=UTF-8''{encoded_filename}"
        )
        media_type = proof.mime_type

    return FileResponse(
        path=file_path,
        media_type=media_type,
        headers={
            "Content-Disposition": disposition,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


@router.get("/{proof_id}/preview")
def preview_payment_proof(
    proof_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    proof = get_proof_or_404(db, proof_id)

    return serve_payment_proof(
        proof=proof,
        download=False,
    )


@router.get("/{proof_id}/download")
def download_payment_proof(
    proof_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    proof = get_proof_or_404(db, proof_id)

    return serve_payment_proof(
        proof=proof,
        download=True,
    )


@router.post("/{proof_id}/approve")
def approve_payment_proof(
    proof_id: UUID,
    payload: PaymentProofApprove,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    proof = get_proof_or_404(
        db,
        proof_id,
        lock=True,
    )

    if proof.status != PaymentProofStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only submitted payment proofs can be approved.",
        )

    payment_request = db.scalar(
        select(PaymentRequest)
        .where(
            PaymentRequest.id == proof.payment_request_id
        )
        .options(
            selectinload(PaymentRequest.customs_case)
            .selectinload(CustomsCase.shipment)
        )
        .with_for_update()
    )

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    proof.status = PaymentProofStatus.APPROVED
    proof.rejection_reason = None
    proof.admin_notes = payload.admin_notes
    proof.reviewed_at = datetime.now(timezone.utc)
    proof.reviewed_by_user_id = current_user.id

    try:
        payment = mark_payment_request_paid(
            db=db,
            payment_request=payment_request,
            provider_transaction_id=(
                payload.provider_transaction_id
            ),
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except Exception:
        db.rollback()
        raise

    return {
        "message": "Payment proof approved and payment recorded successfully.",
        "proof_id": proof_id,
        "payment_request_id": payment_request.id,
        "payment_id": payment.id,
        "payment_status": payment_request.status,
        "proof_status": PaymentProofStatus.APPROVED,
    }


@router.post("/{proof_id}/reject")
def reject_payment_proof(
    proof_id: UUID,
    payload: PaymentProofReject,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("payments.manage")
    ),
):
    proof = get_proof_or_404(
        db,
        proof_id,
        lock=True,
    )

    if proof.status != PaymentProofStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only submitted payment proofs can be rejected.",
        )

    payment_request = db.get(
        PaymentRequest,
        proof.payment_request_id,
    )

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    if getattr(payment_request.status, "value", payment_request.status) == "paid":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A proof cannot be rejected after payment is recorded.",
        )

    proof.status = PaymentProofStatus.REJECTED
    proof.rejection_reason = (
        payload.rejection_reason.strip()
        if payload.rejection_reason
        and payload.rejection_reason.strip()
        else None
    )
    proof.admin_notes = payload.admin_notes
    proof.reviewed_at = datetime.now(timezone.utc)
    proof.reviewed_by_user_id = current_user.id

    db.commit()
    db.refresh(proof)

    return {
        "message": "Payment proof rejected.",
        "proof_id": proof.id,
        "payment_request_id": proof.payment_request_id,
        "proof_status": proof.status,
        "rejection_reason": proof.rejection_reason,
        "reviewed_at": proof.reviewed_at,
    }

