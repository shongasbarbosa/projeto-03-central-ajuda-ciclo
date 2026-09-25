from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TicketCodeCounter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.PositiveSmallIntegerField()),
                ('month', models.PositiveSmallIntegerField()),
                ('last_sequence', models.PositiveIntegerField(default=0)),
            ],
        ),
        migrations.AddConstraint(
            model_name='ticketcodecounter',
            constraint=models.UniqueConstraint(fields=('year', 'month'), name='unique_ticket_code_counter'),
        ),
        # Campos temporariamente anuláveis: o valor real é preenchido pela
        # migration de dados seguinte (0003), em ordem de criação de cada
        # chamado dentro do seu mês. A migration 0004 os torna obrigatórios.
        migrations.AddField(
            model_name='ticket',
            name='code',
            field=models.CharField(max_length=16, null=True, unique=True, editable=False),
        ),
        migrations.AddField(
            model_name='ticket',
            name='code_year',
            field=models.PositiveSmallIntegerField(null=True, editable=False),
        ),
        migrations.AddField(
            model_name='ticket',
            name='code_month',
            field=models.PositiveSmallIntegerField(null=True, editable=False),
        ),
        migrations.AddField(
            model_name='ticket',
            name='code_sequence',
            field=models.PositiveIntegerField(null=True, editable=False),
        ),
    ]
