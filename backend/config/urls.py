from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from core.views import HealthView
from faq.views import FaqArticleViewSet
from tickets.views import TicketListCreateView

faq_list = FaqArticleViewSet.as_view({"get": "list", "post": "create"})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", HealthView.as_view(), name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/offers", include("offers.urls")),
    path("api/tickets", TicketListCreateView.as_view(), name="ticket-list-create"),
    path("api/tickets/", include("tickets.urls")),
    path("api/faq", faq_list, name="faq-list"),
    path("api/faq/", include("faq.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/schema", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
