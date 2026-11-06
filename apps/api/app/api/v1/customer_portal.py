from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.auth import get_current_user
from app.core.database import get_db

from urllib.parse import quote

from fastapi.responses import FileResponse

from app.services.payment_proof_storage import (
    PaymentProofStorageError,
    payment_proof_storage,
)

from app.services.document_storage import (
    DocumentStorageError,
    LocalDocumentStorage,
)

from app.models.access import User, customer_users
from app.models.shipment import Shipment
from app.models.customs import CustomsCase
from app.models.payment import PaymentRequest, PaymentRequestStatus
from app.models.payment_proof import PaymentProof, PaymentProofStatus
from app.models.document import (
    ShipmentDocument,
    DocumentVisibility,
)

from app.schemas.customer_portal import (
    CustomerPortalShipmentSummary,
    CustomerPortalShipmentDetail,
    CustomerPortalDocumentResponse,
    CustomerPortalPaymentRequestResponse,
    CustomerPortalPaymentProofResponse,
)


router = APIRouter(
    prefix="/customer",
    tags=["Customer Portal"],
)

document_storage = LocalDocumentStorage()

def customer_shipment_query(user_id: UUID):
    """
    Return a query restricted to shipments belonging
    to customers linked to the authenticated user.
    """

    linked_customers = (
        select(customer_users.c.customer_id)
        .where(customer_users.c.user_id == user_id)
    )

    return (
        select(Shipment)
        .where(
            Shipment.customer_id.in_(linked_customers),
            Shipment.archived_at.is_(None),
        )
    )


def get_authorized_shipment(
    db: Session,
    user: User,
    shipment_id: UUID,
) -> Shipment:
    """
    Retrieve a shipment only when it belongs to one
    of the authenticated user's linked customers.
    """

    statement = (
        customer_shipment_query(user.id)
        .where(Shipment.id == shipment_id)
        .options(
            selectinload(Shipment.tracking_events),
        )
    )

    shipment = db.scalar(statement)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    return shipment


@router.get(
    "/shipments",
    response_model=list[CustomerPortalShipmentSummary],
)
def list_customer_shipments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List shipments belonging to the authenticated
    user's linked customer accounts.
    """

    statement = (
        customer_shipment_query(current_user.id)
        .order_by(Shipment.created_at.desc())
    )

    return db.scalars(statement).all()


@router.get(
    "/shipments/{shipment_id}",
    response_model=CustomerPortalShipmentDetail,
)
def get_customer_shipment(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return shipment details and tracking events.
    """

    shipment = get_authorized_shipment(
        db=db,
        user=current_user,
        shipment_id=shipment_id,
    )

    shipment.tracking_events.sort(
        key=lambda event: event.event_time,
        reverse=True,
    )

    return shipment


@router.get(
    "/shipments/{shipment_id}/documents",
    response_model=list[CustomerPortalDocumentResponse],
)
def list_customer_shipment_documents(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return customer-visible documents only.

    Internal documents are never exposed through
    this customer endpoint.
    """

    get_authorized_shipment(
        db=db,
        user=current_user,
        shipment_id=shipment_id,
    )

    statement = (
        select(ShipmentDocument)
        .where(
            ShipmentDocument.shipment_id == shipment_id,
            ShipmentDocument.visibility == DocumentVisibility.CUSTOMER,
        )
        .order_by(ShipmentDocument.uploaded_at.desc())
    )

    return db.scalars(statement).all()

@router.get(
    "/shipments/{shipment_id}/documents/{document_id}/download",
)
def download_customer_document(
    shipment_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # First verify that this shipment belongs to
    # one of the authenticated user's customers.
    get_authorized_shipment(
        db=db,
        user=current_user,
        shipment_id=shipment_id,
    )

    # Then require both the correct shipment and
    # customer-visible document classification.
    statement = select(ShipmentDocument).where(
        ShipmentDocument.id == document_id,
        ShipmentDocument.shipment_id == shipment_id,
        ShipmentDocument.visibility == DocumentVisibility.CUSTOMER,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    try:
        file_path = document_storage.resolve(
            document.storage_key
        )
    except DocumentStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document is unavailable.",
        ) from exc

    # Only genuine PDFs are displayed inline.
    is_pdf = (
        document.mime_type.lower() == "application/pdf"
        and file_path.suffix.lower() == ".pdf"
    )

    if is_pdf:
        try:
            with file_path.open("rb") as source:
                is_pdf = source.read(5) == b"%PDF-"
        except OSError:
            is_pdf = False

    encoded_filename = quote(
        document.file_name,
        safe="",
    )

    if is_pdf:
        return FileResponse(
            path=file_path,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f"inline; filename*=UTF-8''{encoded_filename}"
                ),
                "X-Content-Type-Options": "nosniff",
            },
        )

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{encoded_filename}"
            ),
            "X-Content-Type-Options": "nosniff",
        },
    )

def customer_payment_request_query(user_id: UUID):
    linked_customers = (
        select(customer_users.c.customer_id)
        .where(customer_users.c.user_id == user_id)
    )

    return (
        select(PaymentRequest)
        .options(selectinload(PaymentRequest.payment_proofs))
        .join(
            CustomsCase,
            PaymentRequest.customs_case_id == CustomsCase.id,
        )
        .join(
            Shipment,
            CustomsCase.shipment_id == Shipment.id,
        )
        .where(
            Shipment.customer_id.in_(linked_customers),
            Shipment.archived_at.is_(None),
        )
    )


@router.get(
    "/payments",
    response_model=list[CustomerPortalPaymentRequestResponse],
)
def list_customer_payment_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        customer_payment_request_query(current_user.id)
        .order_by(PaymentRequest.created_at.desc())
    )

    return db.scalars(statement).all()


@router.get(
    "/payments/{payment_request_id}",
    response_model=CustomerPortalPaymentRequestResponse,
)
def get_customer_payment_request(
    payment_request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        customer_payment_request_query(current_user.id)
        .where(PaymentRequest.id == payment_request_id)
    )

    payment_request = db.scalar(statement)

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    return payment_request


@router.post(
    "/payments/{payment_request_id}/proofs",
    response_model=CustomerPortalPaymentProofResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_customer_payment_proof(
    payment_request_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        customer_payment_request_query(current_user.id)
        .where(PaymentRequest.id == payment_request_id)
        .with_for_update()
    )

    payment_request = db.scalar(statement)

    if payment_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found.",
        )

    if payment_request.status not in {
        PaymentRequestStatus.PENDING,
        PaymentRequestStatus.PROCESSING,
    }:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This payment request cannot accept proof of payment.",
        )

    existing_proof = db.scalar(
        select(PaymentProof.id)
        .where(
            PaymentProof.payment_request_id == payment_request.id,
            PaymentProof.status == PaymentProofStatus.SUBMITTED,
        )
        .limit(1)
    )

    if existing_proof is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A payment proof is already awaiting review.",
        )

    original_filename = (
        (file.filename or "")
        .replace("\\", "/")
        .rsplit("/", 1)[-1]
        .strip()
    )

    if not original_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A filename is required.",
        )

    original_filename = original_filename[:255]
    storage_key = None

    try:
        storage_key, mime_type, size_bytes = await payment_proof_storage.save(file)

        proof = PaymentProof(
            payment_request_id=payment_request.id,
            storage_key=storage_key,
            original_filename=original_filename,
            mime_type=mime_type,
            size_bytes=size_bytes,
            status=PaymentProofStatus.SUBMITTED,
        )

        db.add(proof)
        db.commit()
        db.refresh(proof)

        return proof

    except PaymentProofStorageError as exc:
        db.rollback()

        if storage_key:
            payment_proof_storage.delete(storage_key)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except Exception:
        db.rollback()

        if storage_key:
            payment_proof_storage.delete(storage_key)

        raise

    finally:
        await file.close()
