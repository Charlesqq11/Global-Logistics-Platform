import pytest

from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.main import app


TEST_DATABASE = "global_logistics_test"

TEST_EMAIL = "staff-a-84f8732de4@example.com"
TEST_PASSWORD = "IsolationTest2026!"


@pytest.fixture(scope="module")
def client():
    database_name = make_url(settings.database_url).database

    assert database_name == TEST_DATABASE, (
        f"Safety check failed. Expected {TEST_DATABASE}, "
        f"connected to {database_name}."
    )

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def authenticated_client():
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
            f"Login failed: {response.status_code} "
            f"{response.text}"
        )

        token = response.json()["access_token"]

        test_client.headers.update({
            "Authorization": f"Bearer {token}"
        })

        yield test_client


def test_valid_customer_login(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["access_token"]
    assert data["token_type"].lower() == "bearer"


def test_invalid_password_is_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": TEST_EMAIL,
            "password": "DefinitelyWrongPassword2026!",
        },
    )

    assert response.status_code in (401, 403)


def test_authenticated_user_can_access_profile(
    authenticated_client,
):
    response = authenticated_client.get(
        "/api/v1/auth/me"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == TEST_EMAIL


def test_unauthenticated_user_cannot_access_profile(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code in (401, 403)