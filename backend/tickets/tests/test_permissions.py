import pytest
from django.core import mail

from conftest import authenticated_client
from tickets.models import Ticket, TicketMessage


@pytest.fixture
def ticket(db, student, offer_matricula):
    return Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        priority=Ticket.Priority.MEDIA,
        subject="Não consigo acessar",
        description="Detalhes.",
    )


@pytest.fixture
def internal_note(db, ticket, agent):
    return TicketMessage.objects.create(
        ticket=ticket, author=agent, body="Nota interna", is_internal_note=True
    )


def test_student_sees_only_own_tickets(student, other_student, offer_matricula):
    Ticket.objects.create(
        author=other_student,
        offer=offer_matricula,
        category=Ticket.Category.TECNICO,
        subject="Outro chamado",
        description="Descrição.",
    )
    client = authenticated_client(student)

    response = client.get("/api/tickets")

    assert response.status_code == 200
    assert response.data["count"] == 0


def test_student_cannot_access_another_students_ticket(other_student, ticket):
    client = authenticated_client(other_student)

    response = client.get(f"/api/tickets/{ticket.id}")

    # 404, não 403: o aluno não deve conseguir distinguir "não existe" de
    # "existe, mas não é seu".
    assert response.status_code == 404


def test_student_patch_on_another_students_ticket_is_404(other_student, ticket):
    client = authenticated_client(other_student)

    response = client.patch(f"/api/tickets/{ticket.id}", {"status": "resolvido"}, format="json")

    assert response.status_code == 404


def test_student_messages_on_another_students_ticket_is_404(other_student, ticket):
    client = authenticated_client(other_student)

    response = client.get(f"/api/tickets/{ticket.id}/messages")

    assert response.status_code == 404


def test_agent_sees_all_tickets(agent, ticket):
    client = authenticated_client(agent)

    response = client.get("/api/tickets")

    assert response.status_code == 200
    assert response.data["count"] == 1


def test_student_does_not_see_internal_notes(student, ticket, internal_note):
    client = authenticated_client(student)

    response = client.get(f"/api/tickets/{ticket.id}")

    assert response.status_code == 200
    assert response.data["messages"] == []


def test_agent_sees_internal_notes(agent, ticket, internal_note):
    client = authenticated_client(agent)

    response = client.get(f"/api/tickets/{ticket.id}")

    assert response.status_code == 200
    assert len(response.data["messages"]) == 1


def test_student_cannot_change_ticket_status(student, ticket):
    client = authenticated_client(student)

    response = client.patch(f"/api/tickets/{ticket.id}", {"status": "resolvido"}, format="json")

    assert response.status_code == 403


def test_agent_can_change_ticket_status(agent, ticket):
    client = authenticated_client(agent)

    response = client.patch(f"/api/tickets/{ticket.id}", {"status": "resolvido"}, format="json")

    assert response.status_code == 200
    ticket.refresh_from_db()
    assert ticket.status == "resolvido"


def test_agent_cannot_close_ticket_without_resolving(agent, ticket):
    client = authenticated_client(agent)

    response = client.patch(f"/api/tickets/{ticket.id}", {"status": "fechado"}, format="json")

    assert response.status_code == 400


def test_status_change_email_includes_ticket_code(agent, ticket):
    client = authenticated_client(agent)

    response = client.patch(f"/api/tickets/{ticket.id}", {"status": "resolvido"}, format="json")

    assert response.status_code == 200
    assert len(mail.outbox) == 1
    sent = mail.outbox[0]
    ticket.refresh_from_db()
    assert ticket.code in sent.subject
    assert ticket.code in sent.body


def test_student_cannot_create_internal_note(student, ticket):
    client = authenticated_client(student)

    response = client.post(
        f"/api/tickets/{ticket.id}/messages",
        {"body": "Nota", "is_internal_note": True},
        format="json",
    )

    assert response.status_code == 400
