from rest_framework.permissions import BasePermission


class IsAgent(BasePermission):
    """Permite acesso apenas a usuários com papel de atendente."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_agent)


class IsStudent(BasePermission):
    """Permite acesso apenas a usuários com papel de aluno."""

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and request.user.is_student)
