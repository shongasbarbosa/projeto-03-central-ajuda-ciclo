"""Regra de cálculo da fase do ciclo de uma oferta.

Mesma regra usada no projeto 1 (vitrine de ofertas):
- "matricula": até o fim do período de matrícula (enrollment_end).
- "andamento": entre o fim da matrícula e o fim do curso (course_end).
- "encerramento": após o fim do curso.
"""

from datetime import date

MATRICULA = "matricula"
ANDAMENTO = "andamento"
ENCERRAMENTO = "encerramento"

CYCLE_PHASE_CHOICES = [
    (MATRICULA, "Matrícula"),
    (ANDAMENTO, "Andamento"),
    (ENCERRAMENTO, "Encerramento"),
]


def compute_cycle_phase(
    enrollment_end: date,
    course_end: date,
    reference: date | None = None,
) -> str:
    """Calcula a fase do ciclo a partir das datas da oferta.

    - Até enrollment_end (inclusive): matrícula.
    - Entre enrollment_end e course_end (inclusive): andamento.
    - Após course_end: encerramento.
    """
    today = reference if reference is not None else date.today()

    if today <= enrollment_end:
        return MATRICULA
    if today <= course_end:
        return ANDAMENTO
    return ENCERRAMENTO
