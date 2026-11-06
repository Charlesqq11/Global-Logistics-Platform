import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.main import app


TEST_DATABASE = "global_logistics_test"
TEST_EMAIL = "staff-a-84f8732de4@example.com"
TEST_PASSWORD = "IsolationTest2026!"


@pytest.fixture(scope="module")
def shipment_id():
    database_name = make_url(settings.database_url).database

    assert database_name == TEST_DATABASE, (
        f"Safety check failed. Expected {TEST_DATABASE}, "
        f"connected to {database_name}."
    )

    engine = create_engine(settings.database_url)

    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT id
                    FROM shipments
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
            ).scalar_one_or_none()

        assert result is not None, (
            "No shipment exists in the test database."
        )

        return str(result)

    finally:
        engine.dispose()


@pytest.fixture
def unauthenticated_client():
    database_name = make_url(settings.database_url).database
    assert database_name == TEST_DATABASE

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def customer_client():
    database_name = make_url(settings.database_url).database
    assert database_name == TEST_DATABASE

    with TestClient(app) as test_client:
        response = test_client.post(
            "/api/v1/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
            },
        )

        assert response.status_code == 200, (
            f"Customer login failed: "
            f"{response.status_code} {response.text}"
        )

        token = response.json()["access_token"]

        test_client.headers.update({
            "Authorization": f"Bearer {token}"
        })

        yield test_client


def test_unauthenticated_user_cannot_list_admin_shipments(
    unauthenticated_client,
):
    response = unauthenticated_client.get(
        "/api/v1/admin/shipments"
    )

    assert response.status_code in (401, 403)


def test_unauthenticated_user_cannot_access_admin_shipment_details(
    unauthenticated_client,
    shipment_id,
):
    response = unauthenticated_client.get(
        f"/api/v1/admin/shipments/{shipment_id}"
    )

    assert response.status_code in (401, 403)


def test_customer_cannot_list_admin_shipments(customer_client):
    response = customer_client.get(
        "/api/v1/admin/shipments"
    )

    assert response.status_code == 403


def test_customer_cannot_access_admin_shipment_details(
    customer_client,
    shipment_id,
):
    response = customer_client.get(
        f"/api/v1/admin/shipments/{shipment_id}"
    )

    assert response.status_code == 403