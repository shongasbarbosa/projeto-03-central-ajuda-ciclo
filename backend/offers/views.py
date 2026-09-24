from rest_framework.generics import ListAPIView

from .models import Offer
from .serializers import OfferSerializer


class OfferListView(ListAPIView):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer
    search_fields = ["name", "course_name"]
    filterset_fields = ["category"]
