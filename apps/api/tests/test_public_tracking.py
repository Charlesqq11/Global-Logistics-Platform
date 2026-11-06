import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.core.config import settings
from app.main import app


TEST_DATABASE = "global_logistics_test"


@pytest.fixture(scope="module")
def tracking_number():
    database_name = make_url(settings.database_url).database

    assert database_name == TEST_DATABASE, (
        f"Safety check failed. Expected {TEST_DATABASE}, "
        f"connected to {database_name}."
    )

    engine = create_engine(settings.database_url)

    try:
        with engine.connect() as connection:
            number = connection.execute(
                text(
                    """
                    SELECT tracking_number
                    FROM shipments
                    ORDER BY created_at DESC
                    LIMIT 1
                    """
                )
            ).scalar_one_or_none()

        assert number is not None, (
            "No shipment exists in the test database."
        )

        return number

    finally:
        engine.dispose()


@pytest.fixture(scope="module")
def client():
    database_name = make_url(settings.database_url).database

    assert database_name == TEST_DATABASE

    with TestClient(app) as test_client:
        yield test_client


def test_public_tracking_returns_existing_shipment(
    client,
    tracking_number,
):
    response = client.get(
        f"/api/v1/tracking/{tracking_number}"
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, dict)
    assert data["tracking_number"] == tracking_number


def test_public_tracking_rejects_unknown_tracking_number(client):
    response = client.get(
        "/api/v1/tracking/GLP-INVALID-TRACKING-999999"
    )

    assert response.status_code == 404


def test_public_tracking_does_not_require_authentication(
    client,
    tracking_number,
):
    response = client.get(
        f"/api/v1/tracking/{tracking_number}"
    )

    assert response.status_code == 200