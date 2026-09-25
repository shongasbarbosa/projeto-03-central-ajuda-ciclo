import pytest

from conftest import authenticated_client
from tickets.models import Ticket


@pytest.fixture
def september_ticket(db, student, offer_matricula):
    ticket = Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        subject="Chamado de setembro",
        description="Descrição.",
    )
    Ticket.objects.filter(pk=ticket.pk).update(
        code="00042-09-2026", code_year=2026, code_month=9, code_sequence=42
    )
    ticket.refresh_from_db()
    return ticket


@pytest.fixture
def october_ticket(db, student, offer_matricula):
    ticket = Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        subject="Chamado de outubro",
        description="Descrição.",
    )
    Ticket.objects.filter(pk=ticket.pk).update(
        code="00042-10-2026", code_year=2026, code_month=10, code_sequence=42
    )
    ticket.refresh_from_db()
    return ticket


@pytest.fixture
def other_student_ticket(db, other_student, offer_matricula):
    ticket = Ticket.objects.create(
        author=other_student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        subject="Chamado de outro aluno",
        description="Descrição.",
    )
    Ticket.objects.filter(pk=ticket.pk).update(
        code="00099-09-2026", code_year=2026, code_month=9, code_sequence=99
    )
    ticket.refresh_from_db()
    return ticket


@pytest.mark.parametrize(
    "query", ["00042-09-2026", "42-9-2026", "42/09/2026", "42 09 2026"]
)
def test_search_full_code_finds_exact_ticket(agent, september_ticket, october_ticket, query):
    client = authenticated_client(agent)

    response = client.get(f"/api/tickets?search={query}")

    assert response.status_code == 200
    assert response.data["count"] == 1
    assert response.data["results"][0]["code"] == "00042-09-2026"


def test_search_number_and_month_lists_tickets_of_that_month(
    agent, september_ticket, other_student_ticket, october_ticket
):
    client = authenticated_client(agent)

    response = client.get("/api/tickets?search=42-09")

    assert response.status_code == 200
    codes = {row["code"] for row in response.data["results"]}
    assert codes == {"00042-09-2026"}


def test_search_number_only_lists_all_months_most_recent_first(
    agent, september_ticket, october_ticket
):
    client = authenticated_client(agent)

    response = client.get("/api/tickets?search=42")

    assert response.status_code == 200
    codes = [row["code"] for row in response.data["results"]]
    assert codes == ["00042-10-2026", "00042-09-2026"]


def test_search_number_only_accepts_hash_prefix(agent, september_ticket):
    client = authenticated_client(agent)

    response = client.get("/api/tickets?search=%2342")

    assert response.status_code == 200
    assert response.data["count"] == 1


def test_search_falls_back_to_text_search_for_non_code_query(agent, september_ticket):
    client = authenticated_client(agent)

    response = client.get("/api/tickets?search=setembro")

    assert response.status_code == 200
    assert response.data["count"] == 1


def test_student_search_by_code_never_finds_another_students_ticket(
    student, other_student_ticket
):
    client = authenticated_client(student)

    response = client.get("/api/tickets?search=00099-09-2026")

    assert response.status_code == 200
    assert response.data["count"] == 0


def test_student_cannot_access_another_students_ticket_by_id(student, other_student_ticket):
    client = authenticated_client(student)

    response = client.get(f"/api/tickets/{other_student_ticket.id}")

    assert response.status_code == 404
