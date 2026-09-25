from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0003_backfill_ticket_codes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='ticket',
            name='code',
            field=models.CharField(max_length=16, unique=True, editable=False, db_index=True),
        ),
        migrations.AlterField(
            model_name='ticket',
            name='code_year',
            field=models.PositiveSmallIntegerField(editable=False),
        ),
        migrations.AlterField(
            model_name='ticket',
            name='code_month',
            field=models.PositiveSmallIntegerField(editable=False),
        ),
        migrations.AlterField(
            model_name='ticket',
            name='code_sequence',
            field=models.PositiveIntegerField(editable=False),
        ),
        migrations.AlterModelOptions(
            name='ticket',
            options={'ordering': ['-code_year', '-code_month', '-code_sequence']},
        ),
    ]
