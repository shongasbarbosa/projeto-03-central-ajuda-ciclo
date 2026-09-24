from django.urls import path

from .views import AvgResolutionTimeView, ReportsSummaryView, TicketsByCyclePhaseView

urlpatterns = [
    path(
        "tickets-by-cycle-phase",
        TicketsByCyclePhaseView.as_view(),
        name="report-tickets-by-cycle-phase",
    ),
    path(
        "avg-resolution-time", AvgResolutionTimeView.as_view(), name="report-avg-resolution-time"
    ),
    path("summary", ReportsSummaryView.as_view(), name="report-summary"),
]
