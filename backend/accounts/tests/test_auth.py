import pytest
from rest_framework.test import APIClient

from conftest import authenticated_client


@pytest.mark.django_db
def test_login_returns_tokens_and_user(student):
    client = APIClient()

    response = client.post(
        "/api/auth/login", {"username": "aluno1", "password": "senha12345"}, format="json"
    )

    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
    assert response.data["user"]["role"] == "aluno"


@pytest.mark.django_db
def test_login_with_wrong_password_fails(student):
    client = APIClient()

    response = client.post(
        "/api/auth/login", {"username": "aluno1", "password": "errada"}, format="json"
    )

    assert response.status_code == 401


def test_me_returns_current_user(student):
    client = authenticated_client(student)

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.data["username"] == "aluno1"


def test_me_requires_authentication():
    client = APIClient()

    response = client.get("/api/auth/me")

    assert response.status_code == 401
