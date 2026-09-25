import { describe, expect, it } from "vitest";

import { isStepClickable } from "../stepper";

describe("isStepClickable", () => {
  it("permite reabrir apenas a etapa imediatamente anterior", () => {
    expect(isStepClickable(2, 1)).toBe(true);
    expect(isStepClickable(3, 2)).toBe(true);
  });

  it("não permite reabrir a etapa atual", () => {
    expect(isStepClickable(1, 1)).toBe(false);
    expect(isStepClickable(2, 2)).toBe(false);
  });

  it("não permite avançar para etapas futuras pelo cabeçalho", () => {
    expect(isStepClickable(1, 2)).toBe(false);
    expect(isStepClickable(1, 3)).toBe(false);
    expect(isStepClickable(2, 3)).toBe(false);
  });

  it("não permite reabrir etapas distantes no passado", () => {
    expect(isStepClickable(3, 1)).toBe(false);
  });
});
