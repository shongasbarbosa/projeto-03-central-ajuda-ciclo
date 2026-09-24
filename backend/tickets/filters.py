import django_filters

from .models import Ticket


class TicketFilter(django_filters.FilterSet):
    class Meta:
        model = Ticket
        fields = [
            "status",
            "category",
            "priority",
            "offer",
            "cycle_phase_at_opening",
            "assigned_to",
        ]

    cycle_phase = django_filters.CharFilter(field_name="cycle_phase_at_opening")
