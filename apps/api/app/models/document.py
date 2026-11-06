from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DocumentType(str, Enum):
    COMMERCIAL_INVOICE = "commercial_invoice"
    CUSTOMS_DECLARATION = "customs_declaration"
    PACKING_LIST = "packing_list"
    SHIPPING_LABEL = "shipping_label"
    PROOF_OF_PAYMENT = "proof_of_payment"
    DELIVERY_DOCUMENT = "delivery_document"
    CUSTOMS_RELEASE = "customs_release"
    OTHER = "other"


class DocumentVisibility(str, Enum):
    CUSTOMER = "customer"
    INTERNAL = "internal"


class ShipmentDocument(Base):
    __tablename__ = "shipment_documents"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    shipment_id: Mapped[UUID] = mapped_column(
        ForeignKey("shipments.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    document_type: Mapped[DocumentType] = mapped_column(
        String(50),
        nullable=False,
    )

    visibility: Mapped[DocumentVisibility] = mapped_column(
        String(20),
        default=DocumentVisibility.INTERNAL,
        nullable=False,
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    storage_key: Mapped[str] = mapped_column(
        String(500),
        unique=True,
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    shipment: Mapped["Shipment"] = relationship(
        back_populates="documents",
    )