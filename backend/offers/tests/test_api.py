import pytest

from conftest import authenticated_client


@pytest.mark.django_db
def test_offer_list_includes_cycle_phase(student, offer_matricula, offer_andamento):
    client = authenticated_client(student)
    response = client.get("/api/offers")

    assert response.status_code == 200
    names_to_phase = {o["name"]: o["cycle_phase"] for o in response.data["results"]}
    assert names_to_phase[offer_matricula.name] == "matricula"
    assert names_to_phase[offer_andamento.name] == "andamento"


@pytest.mark.django_db
def test_offer_list_requires_authentication(offer_matricula):
    from rest_framework.test import APIClient

    client = APIClient()
    response = client.get("/api/offers")

    assert response.status_code == 401
