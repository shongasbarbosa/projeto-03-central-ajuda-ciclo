from datetime import date

import pytest

from offers.cycle_phase import ANDAMENTO, ENCERRAMENTO, MATRICULA, compute_cycle_phase


@pytest.mark.parametrize(
    "reference,expected",
    [
        (date(2026, 1, 1), MATRICULA),
        (date(2026, 1, 15), MATRICULA),
        (date(2026, 1, 16), ANDAMENTO),
        (date(2026, 3, 1), ANDAMENTO),
        (date(2026, 6, 30), ANDAMENTO),
        (date(2026, 7, 1), ENCERRAMENTO),
        (date(2026, 12, 31), ENCERRAMENTO),
    ],
)
def test_compute_cycle_phase(reference, expected):
    enrollment_end = date(2026, 1, 15)
    course_end = date(2026, 6, 30)

    assert compute_cycle_phase(enrollment_end, course_end, reference) == expected


def test_compute_cycle_phase_boundary_is_inclusive_for_enrollment_end():
    enrollment_end = date(2026, 1, 15)
    course_end = date(2026, 6, 30)

    assert compute_cycle_phase(enrollment_end, course_end, enrollment_end) == MATRICULA


def test_compute_cycle_phase_boundary_is_inclusive_for_course_end():
    enrollment_end = date(2026, 1, 15)
    course_end = date(2026, 6, 30)

    assert compute_cycle_phase(enrollment_end, course_end, course_end) == ANDAMENTO


def test_offer_cycle_phase_property_uses_today(
    offer_matricula, offer_andamento, offer_encerramento
):
    assert offer_matricula.cycle_phase == MATRICULA
    assert offer_andamento.cycle_phase == ANDAMENTO
    assert offer_encerramento.cycle_phase == ENCERRAMENTO
