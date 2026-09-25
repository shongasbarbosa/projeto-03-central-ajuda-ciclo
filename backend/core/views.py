from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import HealthSerializer


@extend_schema(
    tags=["health"],
    summary="Healthcheck",
    description="Endpoint público usado para checar se a API está no ar.",
    responses=HealthSerializer,
    examples=[OpenApiExample("Exemplo de resposta", value={"status": "ok"}, response_only=True)],
)
class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})
