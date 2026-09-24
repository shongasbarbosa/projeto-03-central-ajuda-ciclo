from django.db import models

from .cycle_phase import compute_cycle_phase


class Offer(models.Model):
    class Category(models.TextChoices):
        TECNOLOGIA = "tecnologia", "Tecnologia"
        GESTAO = "gestao", "Gestão"
        SAUDE = "saude", "Saúde"
        EDUCACAO = "educacao", "Educação"
        OUTRA = "outra", "Outra"

    name = models.CharField(max_length=200)
    course_name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OUTRA)
    enrollment_start = models.DateField()
    enrollment_end = models.DateField()
    course_start = models.DateField()
    course_end = models.DateField()

    class Meta:
        ordering = ["-enrollment_start"]

    def __str__(self) -> str:
        return f"{self.name} ({self.course_name})"

    @property
    def cycle_phase(self) -> str:
        return compute_cycle_phase(self.enrollment_end, self.course_end)
