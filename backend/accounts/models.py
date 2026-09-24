from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "aluno", "Aluno"
        AGENT = "atendente", "Atendente"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    @property
    def is_agent(self) -> bool:
        return self.role == self.Role.AGENT

    @property
    def is_student(self) -> bool:
        return self.role == self.Role.STUDENT

    def __str__(self) -> str:
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
