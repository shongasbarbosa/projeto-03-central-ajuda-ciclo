from django.core.mail import send_mail
from django.db.models import Q
from rest_framework import generics, permissions

from .code import parse_code_query
from .filters import TicketFilter
from .models import Ticket
from .permissions import CanEditTicket, IsTicketParticipant
from .serializers import (
    TicketCreateSerializer,
    TicketDetailSerializer,
    TicketListSerializer,
    TicketMessageSerializer,
    TicketUpdateSerializer,
)

STATUS_CHANGE_SUBJECT = "Atualização do seu chamado {code}"
STATUS_CHANGE_BODY = (
    "Olá {name},\n\n"
    "O status do seu chamado {code} ({subject}) mudou de "
    "'{old_status}' para '{new_status}'.\n\n"
    "Central de Ajuda por Ciclo"
)


class TicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TicketFilter

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Ticket.objects.none()

        user = self.request.user
        qs = Ticket.objects.select_related("author", "offer", "assigned_to")
        if not user.is_agent:
            qs = qs.filter(author=user)

        search = self.request.query_params.get("search")
        if search:
            qs = self._apply_search(qs, search)

        return qs

    def _apply_search(self, qs, search: str):
        """Busca pelo código do chamado (completo, número+mês ou só número)
        quando `search` parece um código; caso contrário, busca por texto
        em assunto/descrição."""
        code_query = parse_code_query(search)
        if code_query is None:
            return qs.filter(Q(subject__icontains=search) | Q(description__icontains=search))

        qs = qs.filter(code_sequence=code_query.sequence)
        if code_query.month is not None:
            qs = qs.filter(code_month=code_query.month)
        if code_query.year is not None:
            qs = qs.filter(code_year=code_query.year)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TicketCreateSerializer
        return TicketListSerializer


class TicketDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsTicketParticipant, CanEditTicket]

    def get_queryset(self):
        return Ticket.objects.select_related("author", "offer", "assigned_to").prefetch_related(
            "messages", "messages__author"
        )

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return TicketUpdateSerializer
        return TicketDetailSerializer

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        ticket = serializer.save()
        if ticket.status != old_status:
            send_mail(
                subject=STATUS_CHANGE_SUBJECT.format(code=ticket.code),
                message=STATUS_CHANGE_BODY.format(
                    name=ticket.author.get_full_name() or ticket.author.username,
                    code=ticket.code,
                    subject=ticket.subject,
                    old_status=old_status,
                    new_status=ticket.status,
                ),
                from_email=None,
                recipient_list=[ticket.author.email] if ticket.author.email else [],
                fail_silently=True,
            )


class TicketMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketMessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsTicketParticipant]

    def get_ticket(self) -> Ticket:
        return generics.get_object_or_404(Ticket, pk=self.kwargs["ticket_id"])

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Ticket.objects.none()
        ticket = self.get_ticket()
        self.check_object_permissions(self.request, ticket)
        qs = ticket.messages.select_related("author")
        if not self.request.user.is_agent:
            qs = qs.filter(is_internal_note=False)
        return qs

    def perform_create(self, serializer):
        ticket = self.get_ticket()
        self.check_object_permissions(self.request, ticket)
        serializer.save(ticket=ticket)
