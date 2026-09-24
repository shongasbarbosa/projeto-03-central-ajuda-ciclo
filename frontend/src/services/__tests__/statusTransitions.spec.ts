import { describe, expect, it } from "vitest";

import { canTransitionTo } from "../types";

describe("canTransitionTo", () => {
  it("permite aberto -> em_andamento", () => {
    expect(canTransitionTo("aberto", "em_andamento")).toBe(true);
  });

  it("permite aberto -> resolvido", () => {
    expect(canTransitionTo("aberto", "resolvido")).toBe(true);
  });

  it("não permite aberto -> fechado", () => {
    expect(canTransitionTo("aberto", "fechado")).toBe(false);
  });

  it("permite resolvido -> fechado", () => {
    expect(canTransitionTo("resolvido", "fechado")).toBe(true);
  });

  it("não permite fechado -> qualquer outro status", () => {
    expect(canTransitionTo("fechado", "aberto")).toBe(false);
    expect(canTransitionTo("fechado", "em_andamento")).toBe(false);
    expect(canTransitionTo("fechado", "resolvido")).toBe(false);
  });

  it("permite manter o mesmo status", () => {
    expect(canTransitionTo("em_andamento", "em_andamento")).toBe(true);
  });
});
