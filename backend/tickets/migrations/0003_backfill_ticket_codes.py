from collections import defaultdict

from django.db import migrations, transaction
from django.utils import timezone

# Esta lógica é uma cópia intencional de tickets/code.py (format_code e
# compute_monthly_sequences), e não uma importação dela. Migrations de dados
# devem ser independentes do código "vivo" da aplicação: se, no futuro,
# format_code ou compute_monthly_sequences mudarem de comportamento (ou
# forem removidas), esta migration continua reproduzindo exatamente o
# resultado histórico esperado por quem já a rodou.


def _format_code(sequence: int, month: int, year: int) -> str:
    return f"{sequence:05d}-{month:02d}-{year:04d}"


def _compute_monthly_sequences(ordered_rows: list[tuple[int, int, int]]) -> dict[int, int]:
    """Recebe (id, year, month) já ordenados por data de criação (mais
    antigo primeiro) e devolve {id: sequence}, reiniciando o sequencial a
    cada combinação (year, month)."""
    counters: dict[tuple[int, int], int] = defaultdict(int)
    sequences: dict[int, int] = {}
    for pk, year, month in ordered_rows:
        counters[(year, month)] += 1
        sequences[pk] = counters[(year, month)]
    return sequences


def backfill_codes(apps, schema_editor):
    Ticket = apps.get_model('tickets', 'Ticket')
    TicketCodeCounter = apps.get_model('tickets', 'TicketCodeCounter')

    rows = [
        (pk, timezone.localtime(created_at).year, timezone.localtime(created_at).month)
        for pk, created_at in Ticket.objects.order_by('created_at', 'pk').values_list(
            'pk', 'created_at'
        )
    ]
    sequences = _compute_monthly_sequences(rows)

    last_sequence_per_month: dict[tuple[int, int], int] = defaultdict(int)

    with transaction.atomic():
        for pk, year, month in rows:
            sequence = sequences[pk]
            last_sequence_per_month[(year, month)] = sequence
            Ticket.objects.filter(pk=pk).update(
                code=_format_code(sequence, month, year),
                code_year=year,
                code_month=month,
                code_sequence=sequence,
            )

        for (year, month), last_sequence in last_sequence_per_month.items():
            TicketCodeCounter.objects.update_or_create(
                year=year, month=month, defaults={'last_sequence': last_sequence}
            )


def reverse_backfill(apps, schema_editor):
    Ticket = apps.get_model('tickets', 'Ticket')
    Ticket.objects.update(code=None, code_year=None, code_month=None, code_sequence=None)
    apps.get_model('tickets', 'TicketCodeCounter').objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0002_add_ticket_code_fields'),
    ]

    operations = [
        migrations.RunPython(backfill_codes, reverse_backfill),
    ]
