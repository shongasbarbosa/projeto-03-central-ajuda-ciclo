from django.db import models

from offers.cycle_phase import CYCLE_PHASE_CHOICES
from tickets.models import Ticket


class FaqArticle(models.Model):
    question = models.CharField(max_length=300)
    answer = models.TextField()
    category = models.CharField(max_length=20, choices=Ticket.Category.choices)
    cycle_phase = models.CharField(max_length=20, choices=CYCLE_PHASE_CHOICES)
    view_count = models.PositiveIntegerField(default=0)
    helpful_count = models.PositiveIntegerField(default=0)
    not_helpful_count = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "question"]

    def __str__(self) -> str:
        return self.question
