import { describe, expect, it } from "vitest";

import { formatHours, formatNumber, formatOneDecimal } from "../labels";

describe("formatNumber", () => {
  it("formata inteiros em pt-BR", () => {
    expect(formatNumber(80)).toBe("80");
    expect(formatNumber(1234)).toBe("1.234");
  });
});

describe("formatOneDecimal", () => {
  it("usa vírgula decimal com uma casa", () => {
    expect(formatOneDecimal(25.5)).toBe("25,5");
    expect(formatOneDecimal(61.78)).toBe("61,8");
  });
});

describe("formatHours", () => {
  it("retorna travessão para valor nulo", () => {
    expect(formatHours(null)).toBe("—");
  });

  it("formata valores abaixo de uma hora em minutos", () => {
    expect(formatHours(0.5)).toBe("30 min");
  });

  it("formata horas com vírgula decimal e uma casa", () => {
    expect(formatHours(25.5)).toBe("25,5 h");
    expect(formatHours(69.36)).toBe("69,4 h");
  });
});
