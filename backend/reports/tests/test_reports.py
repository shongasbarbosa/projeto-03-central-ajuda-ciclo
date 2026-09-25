from datetime import timedelta

import pytest
from django.utils import timezone

from conftest import authenticated_client
from tickets.models import Ticket


@pytest.fixture
def resolved_ticket(db, student, agent, offer_matricula):
    now = timezone.now()
    ticket = Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.TECNICO,
        subject="Erro técnico",
        description="Descrição.",
    )
    Ticket.objects.filter(pk=ticket.pk).update(
        created_at=now - timedelta(hours=10),
        resolved_at=now,
        status=Ticket.Status.RESOLVIDO,
        assigned_to=agent,
    )
    ticket.refresh_from_db()
    return ticket


def test_students_cannot_access_reports(student, resolved_ticket):
    client = authenticated_client(student)

    response = client.get("/api/reports/summary")

    assert response.status_code == 403


def test_agent_can_access_summary(agent, resolved_ticket):
    client = authenticated_client(agent)

    response = client.get("/api/reports/summary")

    assert response.status_code == 200
    assert response.data["total_tickets"] == 1
    assert response.data["avg_resolution_hours"] == pytest.approx(10, abs=0.1)


def test_tickets_by_cycle_phase(agent, resolved_ticket):
    client = authenticated_client(agent)

    response = client.get("/api/reports/tickets-by-cycle-phase")

    assert response.status_code == 200
    phases = {row["cycle_phase"]: row["total"] for row in response.data}
    assert phases["matricula"] == 1


def test_avg_resolution_time_by_category(agent, resolved_ticket):
    client = authenticated_client(agent)

    response = client.get("/api/reports/avg-resolution-time?category=tecnico")

    assert response.status_code == 200
    assert response.data[0]["total"] == 1


def test_students_cannot_access_tickets_by_priority(student, resolved_ticket):
    client = authenticated_client(student)

    response = client.get("/api/reports/tickets-by-priority")

    assert response.status_code == 403


def test_tickets_by_priority(agent, resolved_ticket):
    client = authenticated_client(agent)

    response = client.get("/api/reports/tickets-by-priority")

    assert response.status_code == 200
    priorities = {row["priority"]: row["total"] for row in response.data}
    assert priorities[resolved_ticket.priority] == 1


def test_tickets_by_priority_filters_by_offer(agent, resolved_ticket, offer_andamento):
    client = authenticated_client(agent)

    response = client.get(f"/api/reports/tickets-by-priority?offer={offer_andamento.id}")

    assert response.status_code == 200
    assert response.data == []
