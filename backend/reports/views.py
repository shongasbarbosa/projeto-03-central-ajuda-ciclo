from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAgent
from tickets.models import Ticket

from .serializers import (
    ReportCategoryRowSerializer,
    ReportPhaseRowSerializer,
    ReportPriorityRowSerializer,
    ReportSummarySerializer,
)

OFFER_PARAMETER = OpenApiParameter(
    name="offer",
    type=int,
    location=OpenApiParameter.QUERY,
    required=False,
    description="Filtra o relatório para uma única oferta (id).",
)


@extend_schema(
    tags=["reports"],
    summary="Volume e tempo médio de resolução por fase do ciclo",
    description=(
        "Agrupa os chamados pela fase do ciclo em que foram abertos "
        "(`cycle_phase_at_opening`) e retorna a quantidade e o tempo médio "
        "de resolução de cada fase."
    ),
    parameters=[OFFER_PARAMETER],
    responses=ReportPhaseRowSerializer(many=True),
    examples=[
        OpenApiExample(
            "Exemplo de resposta",
            value=[
                {"cycle_phase": "matricula", "total": 27, "avg_resolution_hours": 66.2},
                {"cycle_phase": "andamento", "total": 27, "avg_resolution_hours": 70.1},
                {"cycle_phase": "encerramento", "total": 26, "avg_resolution_hours": 71.8},
            ],
            response_only=True,
        )
    ],
)
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


@extend_schema(
    tags=["reports"],
    summary="Tempo médio de resolução por categoria",
    description=(
        "Agrupa os chamados já resolvidos por categoria e retorna a "
        "quantidade e o tempo médio de resolução de cada categoria."
    ),
    parameters=[
        OpenApiParameter(
            name="category",
            type=str,
            location=OpenApiParameter.QUERY,
            required=False,
            enum=[c.value for c in Ticket.Category],
            description="Filtra o relatório para uma única categoria.",
        ),
        OFFER_PARAMETER,
    ],
    responses=ReportCategoryRowSerializer(many=True),
    examples=[
        OpenApiExample(
            "Exemplo de resposta",
            value=[
                {"category": "tecnico", "total": 10, "avg_resolution_hours": 73.8},
                {"category": "matricula", "total": 10, "avg_resolution_hours": 76.1},
            ],
            response_only=True,
        )
    ],
)
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


@extend_schema(
    tags=["reports"],
    summary="Chamados por prioridade",
    description=(
        "Retorna sempre as três prioridades (`baixa`, `media`, `alta`), "
        "nessa ordem, com `total: 0` para prioridades sem nenhum chamado."
    ),
    parameters=[OFFER_PARAMETER],
    responses=ReportPriorityRowSerializer(many=True),
    examples=[
        OpenApiExample(
            "Exemplo de resposta",
            value=[
                {"priority": "baixa", "total": 30},
                {"priority": "media", "total": 22},
                {"priority": "alta", "total": 28},
            ],
            response_only=True,
        )
    ],
)
class TicketsByPriorityView(APIView):
    permission_classes = [IsAuthenticated, IsAgent]

    def get(self, request):
        qs = Ticket.objects.all()
        offer_id = request.query_params.get("offer")
        if offer_id:
            qs = qs.filter(offer_id=offer_id)

        totals = dict(qs.values_list("priority").annotate(total=Count("id")))

        result = [
            {"priority": priority, "total": totals.get(priority, 0)}
            for priority in Ticket.Priority.values
        ]
        return Response(result)


@extend_schema(
    tags=["reports"],
    summary="Resumo geral dos chamados",
    description=(
        "Totais por status e tempos médios de primeira resposta e de "
        "resolução, considerando todos os chamados."
    ),
    responses=ReportSummarySerializer,
    examples=[
        OpenApiExample(
            "Exemplo de resposta",
            value={
                "total_tickets": 80,
                "by_status": {"aberto": 12, "em_andamento": 13, "resolvido": 24, "fechado": 31},
                "avg_first_response_hours": 25.5,
                "avg_resolution_hours": 69.4,
            },
            response_only=True,
        )
    ],
)
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
