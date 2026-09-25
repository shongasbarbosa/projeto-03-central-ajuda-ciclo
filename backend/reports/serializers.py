from rest_framework import serializers

from tickets.models import Ticket


class ReportPhaseRowSerializer(serializers.Serializer):
    cycle_phase = serializers.CharField(help_text="Fase do ciclo em que o chamado foi aberto.")
    total = serializers.IntegerField(help_text="Quantidade de chamados abertos nessa fase.")
    avg_resolution_hours = serializers.FloatField(
        allow_null=True,
        help_text="Tempo médio de resolução em horas, ou null se nenhum chamado foi resolvido.",
    )


class ReportPriorityRowSerializer(serializers.Serializer):
    priority = serializers.ChoiceField(
        choices=Ticket.Priority.choices, help_text="Prioridade do chamado."
    )
    total = serializers.IntegerField(
        help_text="Quantidade de chamados com essa prioridade (0 se não houver nenhum)."
    )


class ReportCategoryRowSerializer(serializers.Serializer):
    category = serializers.ChoiceField(
        choices=Ticket.Category.choices, help_text="Categoria do chamado."
    )
    total = serializers.IntegerField(help_text="Quantidade de chamados resolvidos na categoria.")
    avg_resolution_hours = serializers.FloatField(
        allow_null=True, help_text="Tempo médio de resolução em horas."
    )


class ReportSummarySerializer(serializers.Serializer):
    total_tickets = serializers.IntegerField(help_text="Total de chamados.")
    by_status = serializers.DictField(
        child=serializers.IntegerField(), help_text="Quantidade de chamados por status."
    )
    avg_first_response_hours = serializers.FloatField(
        allow_null=True, help_text="Tempo médio até a primeira resposta, em horas."
    )
    avg_resolution_hours = serializers.FloatField(
        allow_null=True, help_text="Tempo médio de resolução, em horas."
    )
