from collections import defaultdict

from django.db import migrations, transaction
from django.utils import timezone

from tickets.code import compute_monthly_sequences, format_code


def backfill_codes(apps, schema_editor):
    Ticket = apps.get_model('tickets', 'Ticket')
    TicketCodeCounter = apps.get_model('tickets', 'TicketCodeCounter')

    rows = [
        (pk, timezone.localtime(created_at).year, timezone.localtime(created_at).month)
        for pk, created_at in Ticket.objects.order_by('created_at', 'pk').values_list(
            'pk', 'created_at'
        )
    ]
    sequences = compute_monthly_sequences(rows)

    last_sequence_per_month: dict[tuple[int, int], int] = defaultdict(int)

    with transaction.atomic():
        for pk, year, month in rows:
            sequence = sequences[pk]
            last_sequence_per_month[(year, month)] = sequence
            Ticket.objects.filter(pk=pk).update(
                code=format_code(sequence, month, year),
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
