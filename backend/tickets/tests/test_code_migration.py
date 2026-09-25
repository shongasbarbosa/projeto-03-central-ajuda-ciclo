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


def test_data_migration_backfill_module_uses_shared_sequencing_logic():
    """A migration 0003 delega o cálculo do sequencial para
    `compute_monthly_sequences`, garantindo que o preenchimento dos
    chamados existentes siga exatamente a mesma regra testada acima (em
    vez de reimplementar a lógica de forma divergente dentro da
    migration)."""
    import importlib
    import inspect

    module = importlib.import_module("tickets.migrations.0003_backfill_ticket_codes")
    source = inspect.getsource(module.backfill_codes)

    assert "compute_monthly_sequences" in source
