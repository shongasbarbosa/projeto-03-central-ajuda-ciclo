import { describe, expect, it } from "vitest";

import { computeCyclePhase } from "../cyclePhase";

describe("computeCyclePhase", () => {
  const enrollmentEnd = "2026-01-15";
  const courseEnd = "2026-06-30";

  it("retorna matricula antes do fim da matrícula", () => {
    expect(computeCyclePhase(enrollmentEnd, courseEnd, new Date("2026-01-01"))).toBe("matricula");
  });

  it("inclui o dia do fim da matrícula na fase matricula", () => {
    expect(computeCyclePhase(enrollmentEnd, courseEnd, new Date("2026-01-15"))).toBe("matricula");
  });

  it("retorna andamento no dia seguinte ao fim da matrícula", () => {
    expect(computeCyclePhase(enrollmentEnd, courseEnd, new Date("2026-01-16"))).toBe("andamento");
  });

  it("inclui o dia do fim do curso na fase andamento", () => {
    expect(computeCyclePhase(enrollmentEnd, courseEnd, new Date("2026-06-30"))).toBe("andamento");
  });

  it("retorna encerramento após o fim do curso", () => {
    expect(computeCyclePhase(enrollmentEnd, courseEnd, new Date("2026-07-01"))).toBe(
      "encerramento"
    );
  });
});
