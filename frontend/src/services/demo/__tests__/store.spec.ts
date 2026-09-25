import { beforeEach, describe, expect, it } from "vitest";

import { demoState, generateDemoTicketCode, resetDemoState } from "../store";

beforeEach(() => {
  resetDemoState();
  // Isola o teste do estado herdado do seed.json: começa cada mês do zero.
  demoState.codeCounters = {};
});

describe("generateDemoTicketCode", () => {
  it("usa o fuso America/Sao_Paulo, não o fuso local do ambiente de teste", () => {
    // 2026-10-01T02:00:00Z é 2026-09-30T23:00:00 em America/Sao_Paulo
    // (UTC-3): ainda setembro, mesmo já sendo outubro em UTC.
    const code = generateDemoTicketCode(new Date("2026-10-01T02:00:00Z"));

    expect(code).toBe("00001-09-2026");
  });

  it("vira o mês exatamente na meia-noite de Brasília, não na de UTC", () => {
    // 2026-10-01T03:00:00Z é 2026-10-01T00:00:00 em America/Sao_Paulo: já
    // outubro nos dois fusos, então o próximo chamado deve abrir o
    // contador de outubro do zero.
    const code = generateDemoTicketCode(new Date("2026-10-01T03:00:00Z"));

    expect(code).toBe("00001-10-2026");
  });

  it("mantém setembro e outubro como contadores independentes", () => {
    const september = generateDemoTicketCode(new Date("2026-09-30T23:00:00Z")); // 20:00 em Brasília
    const october = generateDemoTicketCode(new Date("2026-10-01T12:00:00Z")); // 09:00 em Brasília
    const septemberAgain = generateDemoTicketCode(new Date("2026-09-30T23:30:00Z"));

    expect(september).toBe("00001-09-2026");
    expect(october).toBe("00001-10-2026");
    expect(septemberAgain).toBe("00002-09-2026");
  });
});
