from pathlib import Path
from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.engine import make_url
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.core.security import hash_password
from app.main import app

from app.models.access import User
from app.models.customer import Customer
from app.models.shipment import Shipment, ShipmentType, ShipmentStatus
from app.models.tracking import TrackingEvent
from app.models.document import (
    ShipmentDocument,
    DocumentType,
    DocumentVisibility,
)


# --------------------------------------------------
# SAFETY CHECK: TEST DATABASE ONLY
# --------------------------------------------------

url = make_url(settings.database_url)

if url.database != "global_logistics_test":
    raise RuntimeError(
        "SAFETY STOP: This script only runs on global_logistics_test."
    )

with engine.connect() as connection:
    current_database = connection.execute(
        text("SELECT current_database()")
    ).scalar()

if current_database != "global_logistics_test":
    raise RuntimeError(
        "SAFETY STOP: Connected database is not global_logistics_test."
    )

print("Database safety check passed:", current_database)


# --------------------------------------------------
# CREATE TWO INDEPENDENT CUSTOMER COMPANIES
# --------------------------------------------------

suffix = uuid4().hex[:10]

password = "IsolationTest2026!"

db = SessionLocal()

try:
    customer_a = Customer(
        customer_code=f"ISO-A-{suffix}",
        first_name="Company",
        last_name="Alpha",
        email=f"alpha-{suffix}@example.com",
        country="Nigeria",
    )

    customer_b = Customer(
        customer_code=f"ISO-B-{suffix}",
        first_name="Company",
        last_name="Beta",
        email=f"beta-{suffix}@example.com",
        country="Nigeria",
    )

    user_a = User(
        email=f"staff-a-{suffix}@example.com",
        password_hash=hash_password(password),
        first_name="Staff",
        last_name="Alpha",
        is_active=True,
        is_verified=True,
    )

    user_b = User(
        email=f"staff-b-{suffix}@example.com",
        password_hash=hash_password(password),
        first_name="Staff",
        last_name="Beta",
        is_active=True,
        is_verified=True,
    )

    customer_a.users.append(user_a)
    customer_b.users.append(user_b)

    shipment_a = Shipment(
        tracking_number=f"ISO-A-{suffix}",
        customer=customer_a,
        shipment_type=ShipmentType.PARCEL.value,
        status=ShipmentStatus.IN_TRANSIT.value,
        origin_country="Nigeria",
        origin_city="Lagos",
        destination_country="United Kingdom",
        destination_city="London",
        description="Company Alpha test shipment",
    )

    shipment_b = Shipment(
        tracking_number=f"ISO-B-{suffix}",
        customer=customer_b,
        shipment_type=ShipmentType.PARCEL.value,
        status=ShipmentStatus.IN_TRANSIT.value,
        origin_country="Nigeria",
        origin_city="Port Harcourt",
        destination_country="United States",
        destination_city="New York",
        description="Company Beta test shipment",
    )

    db.add_all([
        customer_a,
        customer_b,
        user_a,
        user_b,
        shipment_a,
        shipment_b,
    ])

    db.flush()

    event_a = TrackingEvent(
        shipment_id=shipment_a.id,
        status=ShipmentStatus.IN_TRANSIT.value,
        title="Shipment in transit",
        description="Alpha test tracking event",
        location="Lagos",
        event_time=datetime.now(timezone.utc),
    )

    event_b = TrackingEvent(
        shipment_id=shipment_b.id,
        status=ShipmentStatus.IN_TRANSIT.value,
        title="Shipment in transit",
        description="Beta test tracking event",
        location="Port Harcourt",
        event_time=datetime.now(timezone.utc),
    )

    db.add_all([event_a, event_b])

    # Create physical test documents.
    storage_root = Path("storage/documents")

    def create_document(shipment, filename, visibility, content):
        folder = storage_root / str(shipment.id)
        folder.mkdir(parents=True, exist_ok=True)

        file_path = folder / f"{uuid4().hex}.pdf"
        file_path.write_bytes(content)

        document = ShipmentDocument(
            shipment_id=shipment.id,
            document_type=DocumentType.OTHER.value,
            visibility=visibility.value,
            file_name=filename,
            storage_key=file_path.as_posix(),
            mime_type="application/pdf",
        )

        db.add(document)
        return document

    customer_doc_a = create_document(
        shipment_a,
        "Alpha-Customer-Document.pdf",
        DocumentVisibility.CUSTOMER,
        b"%PDF-1.4\nAlpha customer document\n",
    )

    internal_doc_a = create_document(
        shipment_a,
        "Alpha-Internal-Document.pdf",
        DocumentVisibility.INTERNAL,
        b"%PDF-1.4\nAlpha internal document\n",
    )

    customer_doc_b = create_document(
        shipment_b,
        "Beta-Customer-Document.pdf",
        DocumentVisibility.CUSTOMER,
        b"%PDF-1.4\nBeta customer document\n",
    )

    db.commit()

    shipment_a_id = str(shipment_a.id)
    shipment_b_id = str(shipment_b.id)
    customer_doc_a_id = str(customer_doc_a.id)
    internal_doc_a_id = str(internal_doc_a.id)
    customer_doc_b_id = str(customer_doc_b.id)

    email_a = user_a.email
    email_b = user_b.email

finally:
    db.close()


# --------------------------------------------------
# AUTHENTICATE THROUGH THE REAL LOGIN ENDPOINT
# --------------------------------------------------

client = TestClient(app)


def login(email):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200, (
        f"Login failed for {email}: {response.text}"
    )

    return {
        "Authorization": (
            "Bearer " + response.json()["access_token"]
        )
    }


headers_a = login(email_a)
headers_b = login(email_b)

print("\nBoth customer staff accounts logged in successfully.")


# --------------------------------------------------
# CUSTOMER A SECURITY TESTS
# --------------------------------------------------

response = client.get(
    "/api/v1/customer/shipments",
    headers=headers_a,
)

assert response.status_code == 200, response.text

alpha_shipments = response.json()

assert any(
    str(item["id"]) == shipment_a_id
    for item in alpha_shipments
)

assert not any(
    str(item["id"]) == shipment_b_id
    for item in alpha_shipments
)

print("PASS: Company A only sees its own shipments.")


response = client.get(
    f"/api/v1/customer/shipments/{shipment_b_id}",
    headers=headers_a,
)

assert response.status_code == 404
print("PASS: Company A cannot access Company B shipment.")


response = client.get(
    f"/api/v1/customer/shipments/{shipment_a_id}/documents",
    headers=headers_a,
)

assert response.status_code == 200, response.text

visible_documents = response.json()

visible_ids = {
    str(item["id"]) for item in visible_documents
}

assert customer_doc_a_id in visible_ids
assert internal_doc_a_id not in visible_ids

print("PASS: Internal documents are hidden from customers.")


response = client.get(
    f"/api/v1/customer/shipments/{shipment_a_id}/documents/"
    f"{customer_doc_b_id}/download",
    headers=headers_a,
)

assert response.status_code == 404
print("PASS: Company A cannot download Company B document.")


response = client.get(
    f"/api/v1/customer/shipments/{shipment_a_id}/documents/"
    f"{internal_doc_a_id}/download",
    headers=headers_a,
)

assert response.status_code == 404
print("PASS: Company A cannot download its internal document.")


response = client.get(
    f"/api/v1/customer/shipments/{shipment_a_id}/documents/"
    f"{customer_doc_a_id}/download",
    headers=headers_a,
)

assert response.status_code == 200, response.text
assert response.content.startswith(b"%PDF-")

print("PASS: Company A can download its own customer document.")


# --------------------------------------------------
# CUSTOMER B SECURITY TESTS
# --------------------------------------------------

response = client.get(
    "/api/v1/customer/shipments",
    headers=headers_b,
)

assert response.status_code == 200, response.text

beta_shipments = response.json()

assert any(
    str(item["id"]) == shipment_b_id
    for item in beta_shipments
)

assert not any(
    str(item["id"]) == shipment_a_id
    for item in beta_shipments
)

print("PASS: Company B only sees its own shipments.")


response = client.get(
    f"/api/v1/customer/shipments/{shipment_a_id}",
    headers=headers_b,
)

assert response.status_code == 404
print("PASS: Company B cannot access Company A shipment.")


# --------------------------------------------------
# UNAUTHENTICATED ACCESS TEST
# --------------------------------------------------

response = client.get("/api/v1/customer/shipments")

assert response.status_code == 401
print("PASS: Unauthenticated access is rejected.")


print("\nALL CUSTOMER ISOLATION TESTS PASSED.")

print("\nTest accounts:")
print("Company A:", email_a)
print("Company B:", email_b)
print("Password:", password)

print("\nTest shipment IDs:")
print("Company A:", shipment_a_id)
print("Company B:", shipment_b_id)