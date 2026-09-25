from django.urls import path

from .views import (
    AvgResolutionTimeView,
    ReportsSummaryView,
    TicketsByCyclePhaseView,
    TicketsByPriorityView,
)

urlpatterns = [
    path(
        "tickets-by-cycle-phase",
        TicketsByCyclePhaseView.as_view(),
        name="report-tickets-by-cycle-phase",
    ),
    path(
        "tickets-by-priority", TicketsByPriorityView.as_view(), name="report-tickets-by-priority"
    ),
    path(
        "avg-resolution-time", AvgResolutionTimeView.as_view(), name="report-avg-resolution-time"
    ),
    path("summary", ReportsSummaryView.as_view(), name="report-summary"),
]
