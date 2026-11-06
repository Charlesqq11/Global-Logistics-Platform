from __future__ import annotations
from fastapi.responses import FileResponse
from urllib.parse import quote

from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import require_permission
from app.core.database import get_db
from app.models.access import User
from app.models.document import (
    DocumentType,
    DocumentVisibility,
    ShipmentDocument,
)
from app.models.shipment import Shipment
from app.services.document_storage import (
    DocumentStorageError,
    LocalDocumentStorage,
)


router = APIRouter(
    prefix="/admin/shipments",
    tags=["Admin Documents"],
)


document_storage = LocalDocumentStorage()


@router.post(
    "/{shipment_id}/documents",
    status_code=status.HTTP_201_CREATED,
)
def create_shipment_document(
    shipment_id: UUID,
    document_type: DocumentType = Form(...),
    visibility: DocumentVisibility = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("documents.manage")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a filename.",
        )

    try:
        storage_key, file_name = document_storage.save(
            shipment_id=shipment.id,
            file=file,
        )
    except DocumentStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    document = ShipmentDocument(
        shipment_id=shipment.id,
        document_type=document_type,
        visibility=visibility,
        file_name=file_name,
        storage_key=storage_key,
        mime_type=file.content_type or "application/octet-stream",
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)

    except Exception:
        db.rollback()

        try:
            document_storage.delete(storage_key)
        except DocumentStorageError:
            pass

        raise

    return document


@router.get(
    "/{shipment_id}/documents",
)
def list_shipment_documents(
    shipment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("documents.manage")
    ),
):
    shipment = db.get(Shipment, shipment_id)

    if shipment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found.",
        )

    statement = (
        select(ShipmentDocument)
        .where(
            ShipmentDocument.shipment_id == shipment.id
        )
        .order_by(
            ShipmentDocument.uploaded_at.desc()
        )
    )

    return db.scalars(statement).all()


@router.get(
    "/{shipment_id}/documents/{document_id}",
)
def get_shipment_document(
    shipment_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("documents.manage")
    ),
):
    statement = select(ShipmentDocument).where(
        ShipmentDocument.id == document_id,
        ShipmentDocument.shipment_id == shipment_id,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    return document

@router.get(
    "/{shipment_id}/documents/{document_id}/download",
)
def download_shipment_document(
    shipment_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("documents.manage")
    ),
):
    statement = select(ShipmentDocument).where(
        ShipmentDocument.id == document_id,
        ShipmentDocument.shipment_id == shipment_id,
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
            detail="Stored document is unavailable.",
        ) from exc

    # Only serve genuine PDF files inline.
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


@router.delete(
    "/{shipment_id}/documents/{document_id}",
)
def delete_shipment_document(
    shipment_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("documents.manage")
    ),
):
    statement = select(ShipmentDocument).where(
        ShipmentDocument.id == document_id,
        ShipmentDocument.shipment_id == shipment_id,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    storage_key = document.storage_key

    db.delete(document)
    db.commit()

    try:
        document_storage.delete(storage_key)
    except DocumentStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return {
        "message": "Shipment document deleted successfully.",
        "document_id": document_id,
        "shipment_id": shipment_id,
    }