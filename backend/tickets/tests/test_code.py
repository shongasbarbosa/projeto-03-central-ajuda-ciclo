import threading
from datetime import datetime

import pytest
from django.utils import timezone

from tickets.code import format_code, generate_ticket_code, parse_code_query
from tickets.models import Ticket, TicketCodeCounter


def test_format_code_pads_sequence_to_five_digits():
    assert format_code(1, 9, 2026) == "00001-09-2026"
    assert format_code(42, 9, 2026) == "00042-09-2026"
    assert format_code(12345, 1, 2026) == "12345-01-2026"


@pytest.mark.django_db
def test_generate_ticket_code_increments_within_same_month():
    code1, year1, month1, seq1 = generate_ticket_code(
        reference_dt=timezone.make_aware(datetime(2026, 9, 5, 12, 0))
    )
    code2, year2, month2, seq2 = generate_ticket_code(
        reference_dt=timezone.make_aware(datetime(2026, 9, 20, 8, 0))
    )

    assert (year1, month1, seq1) == (2026, 9, 1)
    assert (year2, month2, seq2) == (2026, 9, 2)
    assert code1 == "00001-09-2026"
    assert code2 == "00002-09-2026"


@pytest.mark.django_db
def test_generate_ticket_code_restarts_sequence_each_month():
    for _ in range(3):
        generate_ticket_code(reference_dt=timezone.make_aware(datetime(2026, 9, 15, 12, 0)))

    code, year, month, sequence = generate_ticket_code(
        reference_dt=timezone.make_aware(datetime(2026, 10, 1, 0, 5))
    )

    assert (year, month, sequence) == (2026, 10, 1)
    assert code == "00001-10-2026"


@pytest.mark.django_db
def test_generate_ticket_code_uses_america_sao_paulo_for_month_rollover():
    # 23h do dia 30/09 em America/Sao_Paulo (UTC-3) ainda é setembro,
    # mesmo que em UTC já sejam 02h de 01/10.
    utc_time = datetime(2026, 10, 1, 2, 0, tzinfo=timezone.get_fixed_timezone(0))

    _, year, month, _ = generate_ticket_code(reference_dt=utc_time)

    assert (year, month) == (2026, 9)


@pytest.mark.django_db
def test_generate_ticket_code_after_local_midnight_counts_as_next_month():
    # 00h10 do dia 01/10 em America/Sao_Paulo é 03h10 UTC.
    utc_time = datetime(2026, 10, 1, 3, 10, tzinfo=timezone.get_fixed_timezone(0))

    _, year, month, _ = generate_ticket_code(reference_dt=utc_time)

    assert (year, month) == (2026, 10)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("00042-09-2026", (42, 9, 2026)),
        ("42-9-2026", (42, 9, 2026)),
        ("42/09/2026", (42, 9, 2026)),
        ("42 09 2026", (42, 9, 2026)),
    ],
)
def test_parse_code_query_full_code_variations(raw, expected):
    result = parse_code_query(raw)
    assert (result.sequence, result.month, result.year) == expected


@pytest.mark.parametrize("raw", ["42-09", "42/09", "42 09"])
def test_parse_code_query_number_and_month_without_year(raw):
    result = parse_code_query(raw)
    assert (result.sequence, result.month, result.year) == (42, 9, None)


@pytest.mark.parametrize("raw", ["42", "00042", "#42"])
def test_parse_code_query_number_only(raw):
    result = parse_code_query(raw)
    assert (result.sequence, result.month, result.year) == (42, None, None)


@pytest.mark.parametrize("raw", ["", "  ", "abc", "42-13-2026", "42-00-2026"])
def test_parse_code_query_returns_none_for_non_code_text(raw):
    assert parse_code_query(raw) is None


@pytest.mark.django_db(transaction=True)
def test_generate_ticket_code_is_unique_under_concurrent_creation():
    reference_dt = timezone.make_aware(datetime(2026, 11, 10, 12, 0))
    codes: list[str] = []
    lock = threading.Lock()
    errors: list[Exception] = []

    def worker():
        try:
            from django.db import connections

            code, *_ = generate_ticket_code(reference_dt=reference_dt)
            with lock:
                codes.append(code)
        except Exception as exc:  # pragma: no cover - assertion below fails anyway
            errors.append(exc)
        finally:
            connections.close_all()

    threads = [threading.Thread(target=worker) for _ in range(15)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert not errors
    assert len(codes) == 15
    assert len(set(codes)) == 15, "códigos duplicados gerados sob concorrência"

    counter = TicketCodeCounter.objects.get(year=2026, month=11)
    assert counter.last_sequence == 15


@pytest.mark.django_db
def test_tickets_are_ordered_chronologically_by_code_not_alphabetically(
    student, offer_matricula
):
    september_ticket = Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        subject="Chamado de setembro",
        description="Descrição.",
    )
    Ticket.objects.filter(pk=september_ticket.pk).update(
        code="00042-09-2026", code_year=2026, code_month=9, code_sequence=42
    )

    october_ticket = Ticket.objects.create(
        author=student,
        offer=offer_matricula,
        category=Ticket.Category.ACESSO,
        subject="Chamado de outubro",
        description="Descrição.",
    )
    Ticket.objects.filter(pk=october_ticket.pk).update(
        code="00001-10-2026", code_year=2026, code_month=10, code_sequence=1
    )

    ordered = list(Ticket.objects.filter(pk__in=[september_ticket.pk, october_ticket.pk]))

    # "00001-10-2026" viria antes de "00042-09-2026" em ordem alfabética,
    # mas outubro é cronologicamente depois de setembro.
    assert ordered == [october_ticket, september_ticket]
