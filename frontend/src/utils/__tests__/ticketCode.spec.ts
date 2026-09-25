import { describe, expect, it } from "vitest";

import { formatTicketCode, parseCodeQuery, ticketCodeSortKey } from "../ticketCode";

describe("formatTicketCode", () => {
  it("preenche o sequencial com zeros à esquerda", () => {
    expect(formatTicketCode(1, 9, 2026)).toBe("00001-09-2026");
    expect(formatTicketCode(42, 9, 2026)).toBe("00042-09-2026");
  });
});

describe("parseCodeQuery", () => {
  it.each([
    ["00042-09-2026", { sequence: 42, month: 9, year: 2026 }],
    ["42-9-2026", { sequence: 42, month: 9, year: 2026 }],
    ["42/09/2026", { sequence: 42, month: 9, year: 2026 }],
    ["42 09 2026", { sequence: 42, month: 9, year: 2026 }],
  ])("interpreta o código completo '%s'", (raw, expected) => {
    expect(parseCodeQuery(raw)).toEqual(expected);
  });

  it.each(["42-09", "42/09", "42 09"])(
    "interpreta número e mês sem ano '%s'",
    (raw) => {
      expect(parseCodeQuery(raw)).toEqual({ sequence: 42, month: 9 });
    }
  );

  it.each(["42", "00042", "#42"])("interpreta só o número '%s'", (raw) => {
    expect(parseCodeQuery(raw)).toEqual({ sequence: 42 });
  });

  it.each(["", "  ", "abc", "42-13-2026", "42-00-2026"])(
    "retorna null para texto que não é código '%s'",
    (raw) => {
      expect(parseCodeQuery(raw)).toBeNull();
    }
  );
});

describe("ticketCodeSortKey", () => {
  it("ordena cronologicamente, não alfabeticamente", () => {
    const september = ticketCodeSortKey("00042-09-2026");
    const october = ticketCodeSortKey("00001-10-2026");

    // "00001-10-2026" < "00042-09-2026" em ordem de texto, mas outubro é
    // cronologicamente depois de setembro.
    expect("00001-10-2026" < "00042-09-2026").toBe(true);
    expect(october).toBeGreaterThan(september);
  });
});
