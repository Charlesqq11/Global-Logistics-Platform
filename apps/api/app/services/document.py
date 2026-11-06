from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import (
    DocumentType,
    DocumentVisibility,
    ShipmentDocument,
)
from app.models.shipment import Shipment


def list_shipment_documents(
    db: Session,
    shipment_id: UUID,
) -> list[ShipmentDocument]:
    statement = (
        select(ShipmentDocument)
        .where(
            ShipmentDocument.shipment_id == shipment_id
        )
        .order_by(
            ShipmentDocument.uploaded_at.desc()
        )
    )

    return list(db.scalars(statement).all())


def get_shipment_document(
    db: Session,
    document_id: UUID,
) -> ShipmentDocument | None:
    return db.get(
        ShipmentDocument,
        document_id,
    )


def create_shipment_document(
    db: Session,
    shipment: Shipment,
    document_type: DocumentType,
    visibility: DocumentVisibility,
    file_name: str,
    storage_key: str,
    mime_type: str,
) -> ShipmentDocument:
    if not file_name.strip():
        raise ValueError(
            "Document file name cannot be empty."
        )

    if not storage_key.strip():
        raise ValueError(
            "Document storage key cannot be empty."
        )

    if not mime_type.strip():
        raise ValueError(
            "Document MIME type cannot be empty."
        )

    document = ShipmentDocument(
        shipment_id=shipment.id,
        document_type=document_type,
        visibility=visibility,
        file_name=file_name.strip(),
        storage_key=storage_key.strip(),
        mime_type=mime_type.strip(),
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


def delete_shipment_document(
    db: Session,
    document: ShipmentDocument,
) -> None:
    db.delete(document)
    db.commit()