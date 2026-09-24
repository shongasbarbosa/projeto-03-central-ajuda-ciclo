from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from offers.cycle_phase import CYCLE_PHASE_CHOICES
from offers.models import Offer


class Ticket(models.Model):
    class Category(models.TextChoices):
        ACESSO = "acesso", "Acesso"
        MATRICULA = "matricula", "Matrícula"
        CONTEUDO = "conteudo", "Conteúdo"
        AVALIACAO = "avaliacao", "Avaliação"
        CERTIFICADO = "certificado", "Certificado"
        TECNICO = "tecnico", "Técnico"

    class Priority(models.TextChoices):
        BAIXA = "baixa", "Baixa"
        MEDIA = "media", "Média"
        ALTA = "alta", "Alta"

    class Status(models.TextChoices):
        ABERTO = "aberto", "Aberto"
        EM_ANDAMENTO = "em_andamento", "Em andamento"
        RESOLVIDO = "resolvido", "Resolvido"
        FECHADO = "fechado", "Fechado"

    # Transições de status permitidas: de -> {para}
    ALLOWED_TRANSITIONS: dict[str, set[str]] = {
        Status.ABERTO: {Status.EM_ANDAMENTO, Status.RESOLVIDO},
        Status.EM_ANDAMENTO: {Status.RESOLVIDO, Status.ABERTO},
        Status.RESOLVIDO: {Status.FECHADO, Status.EM_ANDAMENTO},
        Status.FECHADO: set(),
    }

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets_opened"
    )
    offer = models.ForeignKey(Offer, on_delete=models.PROTECT, related_name="tickets")
    category = models.CharField(max_length=20, choices=Category.choices)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIA)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ABERTO)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    cycle_phase_at_opening = models.CharField(max_length=20, choices=CYCLE_PHASE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    first_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tickets_assigned",
        limit_choices_to={"role": "atendente"},
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"#{self.pk} {self.subject}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.cycle_phase_at_opening:
            self.cycle_phase_at_opening = self.offer.cycle_phase
        super().save(*args, **kwargs)

    def can_transition_to(self, new_status: str) -> bool:
        if new_status == self.status:
            return True
        return new_status in self.ALLOWED_TRANSITIONS.get(self.status, set())

    def transition_to(self, new_status: str) -> None:
        if not self.can_transition_to(new_status):
            raise ValidationError(
                f"Não é possível mudar o status de '{self.status}' para '{new_status}'."
            )
        now = timezone.now()
        if new_status == self.Status.RESOLVIDO and not self.resolved_at:
            self.resolved_at = now
        if new_status == self.Status.FECHADO and not self.closed_at:
            self.closed_at = now
        self.status = new_status


class TicketMessage(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_internal_note = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Mensagem de {self.author} em #{self.ticket_id}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.is_internal_note and self.author_id != self.ticket.author_id:
            if self.ticket.first_response_at is None:
                self.ticket.first_response_at = self.created_at
                self.ticket.save(update_fields=["first_response_at"])
