import type { CyclePhase } from "@/services/types";

/**
 * Mesma regra usada no backend (offers/cycle_phase.py) e no projeto 1:
 * - "matricula": até o fim do período de matrícula (enrollment_end), inclusive.
 * - "andamento": entre o fim da matrícula e o fim do curso (course_end), inclusive.
 * - "encerramento": após o fim do curso.
 */
export function computeCyclePhase(
  enrollmentEnd: string,
  courseEnd: string,
  reference: Date = new Date()
): CyclePhase {
  const today = toDateOnly(reference);
  const end = toDateOnly(new Date(enrollmentEnd));
  const courseEndDate = toDateOnly(new Date(courseEnd));

  if (today <= end) return "matricula";
  if (today <= courseEndDate) return "andamento";
  return "encerramento";
}

function toDateOnly(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}
