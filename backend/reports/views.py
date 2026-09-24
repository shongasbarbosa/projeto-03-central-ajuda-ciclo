from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAgent
from tickets.models import Ticket


class TicketsByCyclePhaseView(APIView):
    permission_classes = [IsAuthenticated, IsAgent]

    def get(self, request):
        qs = Ticket.objects.all()
        offer_id = request.query_params.get("offer")
        if offer_id:
            qs = qs.filter(offer_id=offer_id)

        resolution_duration = ExpressionWrapper(
            F("resolved_at") - F("created_at"), output_field=DurationField()
        )
        data = (
            qs.values("cycle_phase_at_opening")
            .annotate(
                total=Count("id"),
                avg_resolution_seconds=Avg(resolution_duration, filter=None),
            )
            .order_by("cycle_phase_at_opening")
        )
        result = []
        for row in data:
            avg = row["avg_resolution_seconds"]
            result.append(
                {
                    "cycle_phase": row["cycle_phase_at_opening"],
                    "total": row["total"],
                    "avg_resolution_hours": round(avg.total_seconds() / 3600, 2) if avg else None,
                }
            )
        return Response(result)


class AvgResolutionTimeView(APIView):
    permission_classes = [IsAuthenticated, IsAgent]

    def get(self, request):
        qs = Ticket.objects.filter(resolved_at__isnull=False)
        category = request.query_params.get("category")
        offer_id = request.query_params.get("offer")
        if category:
            qs = qs.filter(category=category)
        if offer_id:
            qs = qs.filter(offer_id=offer_id)

        resolution_duration = ExpressionWrapper(
            F("resolved_at") - F("created_at"), output_field=DurationField()
        )
        data = (
            qs.values("category")
            .annotate(avg_seconds=Avg(resolution_duration), total=Count("id"))
            .order_by("category")
        )
        result = [
            {
                "category": row["category"],
                "total": row["total"],
                "avg_resolution_hours": round(row["avg_seconds"].total_seconds() / 3600, 2)
                if row["avg_seconds"]
                else None,
            }
            for row in data
        ]
        return Response(result)


class ReportsSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAgent]

    def get(self, request):
        qs = Ticket.objects.all()
        by_status = dict(
            qs.values_list("status").annotate(total=Count("id")).order_by("status")
        )

        first_response_duration = ExpressionWrapper(
            F("first_response_at") - F("created_at"), output_field=DurationField()
        )
        resolution_duration = ExpressionWrapper(
            F("resolved_at") - F("created_at"), output_field=DurationField()
        )
        aggregates = qs.aggregate(
            avg_first_response=Avg(first_response_duration),
            avg_resolution=Avg(resolution_duration),
        )

        def to_hours(value):
            return round(value.total_seconds() / 3600, 2) if value else None

        return Response(
            {
                "total_tickets": qs.count(),
                "by_status": by_status,
                "avg_first_response_hours": to_hours(aggregates["avg_first_response"]),
                "avg_resolution_hours": to_hours(aggregates["avg_resolution"]),
            }
        )
