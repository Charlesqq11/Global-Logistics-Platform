from sqlalchemy import select, text
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.core.database import engine
from app.main import app
from app.models.access import User, Role
from app.models.shipment import Shipment


# DATABASE SAFETY CHECK
with engine.connect() as connection:
    database = connection.execute(
        text("SELECT current_database()")
    ).scalar()

assert database == "global_logistics_test", (
    f"STOP: Wrong database: {database}"
)

print("Database safety check passed:", database)


TEST_PASSWORD = "IsolationTest2026!"
client = TestClient(app)

admin_email = None
uploaded_document_id = None
shipment_id = None


def login(email):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200, (
        f"Login failed: {response.status_code} {response.text}"
    )

    return response.json()["access_token"]


try:
    # FIND EXISTING TEST USERS AND SUPER_ADMIN ROLE
    with Session(engine) as db:
        admin_user = db.execute(
            select(User).where(
                User.email.like("staff-a-%@example.com")
            ).limit(1)
        ).scalar_one_or_none()

        customer_user = db.execute(
            select(User).where(
                User.email.like("staff-b-%@example.com")
            ).limit(1)
        ).scalar_one_or_none()

        admin_role = db.execute(
            select(Role).where(
                Role.name == "SUPER_ADMIN"
            )
        ).scalar_one_or_none()

        assert admin_user is not None, "Company A test user not found."
        assert customer_user is not None, "Company B test user not found."
        assert admin_role is not None, "SUPER_ADMIN role not found."

        admin_email = admin_user.email
        customer_email = customer_user.email

        # Temporarily grant admin role to Company A test user.
        if admin_role not in admin_user.roles:
            admin_user.roles.append(admin_role)

        shipment = db.execute(
            select(Shipment).limit(1)
        ).scalar_one_or_none()

        assert shipment is not None, "No test shipment found."

        shipment_id = str(shipment.id)

        db.commit()

    print("Test users and shipment located.")

    # LOGIN
    admin_token = login(admin_email)
    customer_token = login(customer_email)

    admin_headers = {
        "Authorization": f"Bearer {admin_token}"
    }

    customer_headers = {
        "Authorization": f"Bearer {customer_token}"
    }

    print("Both test accounts logged in successfully.")

    # TEST 1: UNAUTHENTICATED ACCESS
    response = client.get(
        "/api/v1/admin/shipments"
    )

    assert response.status_code == 401, (
        f"Expected 401, received {response.status_code}"
    )

    print("PASS: Unauthenticated admin access rejected.")

    # TEST 2: CUSTOMER ACCESS TO ADMIN SHIPMENTS
    response = client.get(
        "/api/v1/admin/shipments",
        headers=customer_headers,
    )

    assert response.status_code == 403, (
        f"Expected 403, received {response.status_code}"
    )

    print("PASS: Customer cannot access admin shipments.")

    # TEST 3: CUSTOMER ACCESS TO ADMIN DOCUMENTS
    response = client.get(
        f"/api/v1/admin/shipments/{shipment_id}/documents",
        headers=customer_headers,
    )

    assert response.status_code == 403, (
        f"Expected 403, received {response.status_code}"
    )

    print("PASS: Customer cannot access admin documents.")

    # TEST 4: SUPER_ADMIN SHIPMENT ACCESS
    response = client.get(
        "/api/v1/admin/shipments",
        headers=admin_headers,
    )

    assert response.status_code == 200, (
        f"Expected 200, received {response.status_code}: "
        f"{response.text}"
    )

    print("PASS: SUPER_ADMIN can list shipments.")

    # TEST 5: SUPER_ADMIN DOCUMENT ACCESS
    response = client.get(
        f"/api/v1/admin/shipments/{shipment_id}/documents",
        headers=admin_headers,
    )

    assert response.status_code == 200, (
        f"Expected 200, received {response.status_code}: "
        f"{response.text}"
    )

    print("PASS: SUPER_ADMIN can list shipment documents.")

    # TEST 6: UPLOAD A TEST DOCUMENT
    pdf_content = (
        b"%PDF-1.4\n"
        b"Global Logistics Platform Security Test\n"
        b"%%EOF"
    )

    response = client.post(
        f"/api/v1/admin/shipments/{shipment_id}/documents",
        headers=admin_headers,
        data={
            "document_type": "other",
            "visibility": "internal",
        },
        files={
            "file": (
                "admin-security-test.pdf",
                pdf_content,
                "application/pdf",
            )
        },
    )

    assert response.status_code in (200, 201), (
        f"Upload failed: {response.status_code}: {response.text}"
    )

    uploaded_document_id = response.json()["id"]

    print("PASS: SUPER_ADMIN can upload a document.")

    # TEST 7: DOWNLOAD TEST DOCUMENT
    response = client.get(
        f"/api/v1/admin/shipments/{shipment_id}/documents/"
        f"{uploaded_document_id}/download",
        headers=admin_headers,
    )

    assert response.status_code == 200, (
        f"Download failed: {response.status_code}: {response.text}"
    )

    assert response.content.startswith(b"%PDF-"), (
        "Downloaded document is not a valid PDF."
    )

    print("PASS: SUPER_ADMIN can download a PDF.")

    # TEST 8: DELETE TEST DOCUMENT
    response = client.delete(
        f"/api/v1/admin/shipments/{shipment_id}/documents/"
        f"{uploaded_document_id}",
        headers=admin_headers,
    )

    assert response.status_code in (200, 204), (
        f"Delete failed: {response.status_code}: {response.text}"
    )

    uploaded_document_id = None

    print("PASS: SUPER_ADMIN can delete the test document.")

    print("\nALL ADMIN SECURITY TESTS PASSED.")

finally:
    # CLEAN UP DOCUMENT IF AN EARLIER TEST FAILED
    if uploaded_document_id and shipment_id and admin_email:
        try:
            token = login(admin_email)

            client.delete(
                f"/api/v1/admin/shipments/{shipment_id}/documents/"
                f"{uploaded_document_id}",
                headers={
                    "Authorization": f"Bearer {token}"
                },
            )

        except Exception:
            print("WARNING: Test document cleanup needs attention.")

    # REMOVE TEMPORARY ADMIN ROLE
    if admin_email:
        with Session(engine) as db:
            user = db.execute(
                select(User).where(
                    User.email == admin_email
                )
            ).scalar_one_or_none()

            role = db.execute(
                select(Role).where(
                    Role.name == "SUPER_ADMIN"
                )
            ).scalar_one_or_none()

            if user is not None and role is not None:
                if role in user.roles:
                    user.roles.remove(role)

                db.commit()

        print("Temporary SUPER_ADMIN grant removed.")