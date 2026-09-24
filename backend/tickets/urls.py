from django.urls import path

from .views import TicketDetailView, TicketMessageListCreateView

urlpatterns = [
    path("<int:pk>", TicketDetailView.as_view(), name="ticket-detail"),
    path(
        "<int:ticket_id>/messages",
        TicketMessageListCreateView.as_view(),
        name="ticket-messages",
    ),
]
