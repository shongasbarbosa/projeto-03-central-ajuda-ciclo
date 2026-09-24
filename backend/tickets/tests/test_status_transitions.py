import pytest
from django.core.exceptions import ValidationError

from tickets.models import Ticket


@pytest.fixture
def ticket(db, student, offer_matricula):
    return Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        priority=Ticket.Priority.MEDIA,
        subject="Não consigo acessar",
        description="Detalhes do problema.",
    )


def test_new_ticket_starts_open(ticket):
    assert ticket.status == Ticket.Status.ABERTO


def test_ticket_records_cycle_phase_at_opening(ticket):
    assert ticket.cycle_phase_at_opening == "matricula"


@pytest.mark.parametrize(
    "from_status,to_status,allowed",
    [
        (Ticket.Status.ABERTO, Ticket.Status.EM_ANDAMENTO, True),
        (Ticket.Status.ABERTO, Ticket.Status.RESOLVIDO, True),
        (Ticket.Status.ABERTO, Ticket.Status.FECHADO, False),
        (Ticket.Status.EM_ANDAMENTO, Ticket.Status.RESOLVIDO, True),
        (Ticket.Status.RESOLVIDO, Ticket.Status.FECHADO, True),
        (Ticket.Status.RESOLVIDO, Ticket.Status.ABERTO, False),
        (Ticket.Status.FECHADO, Ticket.Status.ABERTO, False),
        (Ticket.Status.FECHADO, Ticket.Status.EM_ANDAMENTO, False),
    ],
)
def test_transition_rules(ticket, from_status, to_status, allowed):
    ticket.status = from_status
    ticket.save(update_fields=["status"])

    assert ticket.can_transition_to(to_status) is allowed

    if allowed:
        ticket.transition_to(to_status)
        assert ticket.status == to_status
    else:
        with pytest.raises(ValidationError):
            ticket.transition_to(to_status)


def test_cannot_close_ticket_without_resolving_first(ticket):
    with pytest.raises(ValidationError):
        ticket.transition_to(Ticket.Status.FECHADO)


def test_transition_to_resolvido_sets_resolved_at(ticket):
    assert ticket.resolved_at is None
    ticket.transition_to(Ticket.Status.RESOLVIDO)
    assert ticket.resolved_at is not None


def test_transition_to_fechado_sets_closed_at(ticket):
    ticket.transition_to(Ticket.Status.RESOLVIDO)
    ticket.transition_to(Ticket.Status.FECHADO)
    assert ticket.closed_at is not None
