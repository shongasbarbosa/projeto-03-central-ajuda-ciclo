import pytest

from conftest import authenticated_client
from faq.models import FaqArticle
from tickets.models import Ticket


@pytest.fixture
def article(db):
    return FaqArticle.objects.create(
        question="Como recupero minha senha?",
        answer="Use o link 'Esqueci minha senha' na tela de login.",
        category=Ticket.Category.ACESSO,
        cycle_phase="matricula",
    )


def test_student_can_list_published_faq(student, article):
    client = authenticated_client(student)

    response = client.get("/api/faq")

    assert response.status_code == 200
    assert response.data["count"] == 1


def test_student_cannot_create_faq(student):
    client = authenticated_client(student)

    response = client.post(
        "/api/faq",
        {
            "question": "Nova pergunta?",
            "answer": "Resposta.",
            "category": "acesso",
            "cycle_phase": "matricula",
        },
        format="json",
    )

    assert response.status_code == 403


def test_agent_can_create_faq(agent):
    client = authenticated_client(agent)

    response = client.post(
        "/api/faq",
        {
            "question": "Nova pergunta?",
            "answer": "Resposta.",
            "category": "acesso",
            "cycle_phase": "matricula",
        },
        format="json",
    )

    assert response.status_code == 201


def test_feedback_increments_helpful_count(student, article):
    client = authenticated_client(student)

    response = client.post(f"/api/faq/{article.id}/feedback", {"helpful": True}, format="json")

    assert response.status_code == 200
    article.refresh_from_db()
    assert article.helpful_count == 1


def test_suggestions_match_query(student, article):
    client = authenticated_client(student)

    response = client.get("/api/faq/suggestions?query=senha")

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["id"] == article.id


def test_suggestions_filtered_by_offer_cycle_phase(student, article, offer_andamento):
    client = authenticated_client(student)

    response = client.get(f"/api/faq/suggestions?offer={offer_andamento.id}")

    assert response.status_code == 200
    assert response.data == []
