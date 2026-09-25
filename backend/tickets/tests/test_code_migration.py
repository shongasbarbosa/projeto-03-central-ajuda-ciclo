import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from tickets.code import compute_monthly_sequences


def test_compute_monthly_sequences_restarts_per_month_in_creation_order():
    # (pk, year, month), já ordenados por data de criação (mais antigo primeiro).
    rows = [
        (10, 2026, 9),  # 1º de setembro
        (11, 2026, 9),  # 2º de setembro
        (12, 2026, 10),  # 1º de outubro (mês novo: reinicia)
        (13, 2026, 9),  # 3º de setembro, criado depois do de outubro
        (14, 2026, 10),  # 2º de outubro
    ]

    sequences = compute_monthly_sequences(rows)

    assert sequences == {10: 1, 11: 2, 12: 1, 13: 3, 14: 2}


def test_compute_monthly_sequences_handles_multiple_years():
    rows = [
        (1, 2025, 12),
        (2, 2026, 1),
        (3, 2026, 1),
    ]

    sequences = compute_monthly_sequences(rows)

    assert sequences == {1: 1, 2: 1, 3: 2}


def test_compute_monthly_sequences_empty_input():
    assert compute_monthly_sequences([]) == {}


@pytest.mark.django_db(transaction=True)
def test_backfill_migration_assigns_chronological_codes_per_month():
    """Executa de verdade a migration 0003 (não apenas suas funções
    auxiliares em isolamento): volta o banco para o estado logo após a
    0002 (campos de código ainda anuláveis, sem contador), cria chamados
    sem código em meses diferentes e fora de ordem cronológica de pk, migra
    até a 0004 e confere que os códigos, a ordem cronológica e os
    contadores batem com o esperado."""
    app = "tickets"
    executor = MigrationExecutor(connection)

    start_state = executor.migrate([(app, "0002_add_ticket_code_fields")])
    executor = MigrationExecutor(connection)  # recarrega o grafo pós-migração

    OldTicket = start_state.apps.get_model(app, "Ticket")
    OldOffer = start_state.apps.get_model("offers", "Offer")
    OldUser = start_state.apps.get_model("accounts", "User")

    try:
        user = OldUser.objects.create(username="migracao.aluno", role="aluno")
        offer = OldOffer.objects.create(
            name="Turma migração",
            course_name="Curso de teste",
            category="outra",
            enrollment_start="2026-01-01",
            enrollment_end="2026-01-31",
            course_start="2026-02-01",
            course_end="2026-12-31",
        )

        def make_ticket(created_at: str) -> int:
            ticket = OldTicket.objects.create(
                author_id=user.pk,
                offer_id=offer.pk,
                category="acesso",
                priority="media",
                status="aberto",
                subject="Chamado da migração",
                description="Descrição.",
                cycle_phase_at_opening="andamento",
            )
            OldTicket.objects.filter(pk=ticket.pk).update(created_at=created_at)
            return ticket.pk

        # Fora de ordem de criação/pk para provar que a ordenação usada pela
        # migration é por created_at, não por pk.
        pk_sep_1 = make_ticket("2026-09-05T10:00:00Z")
        pk_oct_1 = make_ticket("2026-10-01T10:00:00Z")
        pk_sep_2 = make_ticket("2026-09-20T10:00:00Z")
        pk_oct_2 = make_ticket("2026-10-15T10:00:00Z")

        end_state = executor.migrate([(app, "0004_alter_ticket_code_required")])

        NewTicket = end_state.apps.get_model(app, "Ticket")
        NewCounter = end_state.apps.get_model(app, "TicketCodeCounter")

        codes = {
            pk: NewTicket.objects.get(pk=pk)
            for pk in (pk_sep_1, pk_oct_1, pk_sep_2, pk_oct_2)
        }

        assert codes[pk_sep_1].code == "00001-09-2026"
        assert codes[pk_sep_2].code == "00002-09-2026"
        assert codes[pk_oct_1].code == "00001-10-2026"
        assert codes[pk_oct_2].code == "00002-10-2026"

        assert NewCounter.objects.get(year=2026, month=9).last_sequence == 2
        assert NewCounter.objects.get(year=2026, month=10).last_sequence == 2
    finally:
        # Restaura o estado de migração esperado pelo resto da suíte.
        executor = MigrationExecutor(connection)
        executor.migrate([(app, "0004_alter_ticket_code_required")])
