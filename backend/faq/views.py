from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import FaqArticleFilter
from .models import FaqArticle
from .serializers import FaqArticleSerializer, FaqFeedbackSerializer


class IsAgentOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_agent)


class FaqArticleViewSet(viewsets.ModelViewSet):
    serializer_class = FaqArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAgentOrReadOnly]
    filterset_class = FaqArticleFilter
    search_fields = ["question", "answer"]

    def get_queryset(self):
        qs = FaqArticle.objects.all()
        if not self.request.user.is_agent:
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action == "feedback":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        FaqArticle.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)
        instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def feedback(self, request, pk=None):
        article = self.get_object()
        serializer = FaqFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        field = "helpful_count" if serializer.validated_data["helpful"] else "not_helpful_count"
        setattr(article, field, getattr(article, field) + 1)
        article.save(update_fields=[field])
        return Response(FaqArticleSerializer(article).data)


class FaqSuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("query", "").strip()
        offer_id = request.query_params.get("offer")

        qs = FaqArticle.objects.filter(is_published=True)

        if offer_id:
            from offers.models import Offer

            try:
                offer = Offer.objects.get(pk=offer_id)
                qs = qs.filter(cycle_phase=offer.cycle_phase)
            except Offer.DoesNotExist:
                pass

        if query:
            terms = [t for t in query.split() if t]
            term_filter = Q()
            for term in terms:
                term_filter |= Q(question__icontains=term) | Q(answer__icontains=term)
            if term_filter:
                qs = qs.filter(term_filter)

        articles = list(qs[:5])
        serializer = FaqArticleSerializer(articles, many=True)
        return Response(serializer.data)
