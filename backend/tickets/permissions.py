from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Ticket


class IsTicketParticipant(BasePermission):
    """Aluno só acessa os próprios tickets; atendente acessa todos."""

    def has_object_permission(self, request, view, obj: Ticket) -> bool:
        if request.user.is_agent:
            return True
        return obj.author_id == request.user.id


class CanEditTicket(BasePermission):
    """Somente o atendente pode alterar status, prioridade e atribuição."""

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return True
        if request.method == "POST":
            return True
        return request.user.is_agent
