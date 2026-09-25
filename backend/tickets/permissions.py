from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Ticket


class IsTicketParticipant(BasePermission):
    """Aluno só acessa os próprios tickets; atendente acessa todos."""

    def has_object_permission(self, request, view, obj: Ticket) -> bool:
        if request.user.is_agent:
            return True
        return obj.author_id == request.user.id


class CanEditTicket(BasePermission):
    """Somente o atendente pode alterar status, prioridade e atribuição.

    A checagem é feita em `has_object_permission` (não em `has_permission`)
    para que ela só entre em jogo depois que o objeto já foi localizado pelo
    queryset (restrito por autor para alunos): assim, um aluno tentando
    alterar o chamado de outro aluno recebe 404 (o objeto não está no
    queryset dele), e só um aluno tentando alterar o próprio chamado recebe
    403 (objeto encontrado, mas ele não é atendente).
    """

    def has_object_permission(self, request, view, obj: Ticket) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_agent
