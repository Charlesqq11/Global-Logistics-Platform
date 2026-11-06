import pytest
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.main import app


TEST_DATABASE = "global_logistics_test"
TEST_EMAIL = "staff-a-84f8732de4@example.com"
TEST_PASSWORD = "IsolationTest2026!"

TEST_SHIPMENT_ID = str(
    UUID("00000000-0000-4000-8000-000000000001")
)

TEST_PAYMENT_ID = str(
    UUID("00000000-0000-4000-8000-000000000002")
)


@pytest.fixture
def unauthenticated_client():
    database_name = make_url(settings.database_url).database

    assert database_name == TEST_DATABASE, (
        f"Safety check failed. Expected {TEST_DATABASE}, "
        f"connected to {database_name}."
    )

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def customer_client():
    database_name = make_url(settings.database_url).database

    assert database_name == TEST_DATABASE, (
        f"Safety check failed. Expected {TEST_DATABASE}, "
        f"connected to {database_name}."
    )

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


# CUSTOMS AUTHORIZATION TESTS

def test_unauthenticated_user_cannot_list_customs_cases(
    unauthenticated_client,
):
    response = unauthenticated_client.get(
        "/api/v1/admin/customs"
    )

    assert response.status_code in (401, 403)


def test_customer_cannot_list_customs_cases(customer_client):
    response = customer_client.get(
        "/api/v1/admin/customs"
    )

    assert response.status_code == 403


def test_unauthenticated_user_cannot_access_customs_details(
    unauthenticated_client,
):
    response = unauthenticated_client.get(
        f"/api/v1/admin/customs/{TEST_SHIPMENT_ID}"
    )

    assert response.status_code in (401, 403)


def test_customer_cannot_access_customs_details(
    customer_client,
):
    response = customer_client.get(
        f"/api/v1/admin/customs/{TEST_SHIPMENT_ID}"
    )

    assert response.status_code == 403


# PAYMENT AUTHORIZATION TESTS

def test_unauthenticated_user_cannot_list_payment_requests(
    unauthenticated_client,
):
    response = unauthenticated_client.get(
        "/api/v1/admin/payments"
    )

    assert response.status_code in (401, 403)


def test_customer_cannot_list_payment_requests(
    customer_client,
):
    response = customer_client.get(
        "/api/v1/admin/payments"
    )

    assert response.status_code == 403


def test_unauthenticated_user_cannot_access_payment_details(
    unauthenticated_client,
):
    response = unauthenticated_client.get(
        f"/api/v1/admin/payments/{TEST_PAYMENT_ID}"
    )

    assert response.status_code in (401, 403)


def test_customer_cannot_access_payment_details(
    customer_client,
):
    response = customer_client.get(
        f"/api/v1/admin/payments/{TEST_PAYMENT_ID}"
    )

    assert response.status_code == 403