import { describe, expect, it } from "vitest";

import { buildQuery, readQueryEnum, readQueryParam, readQueryPositiveInt } from "../queryFilters";

describe("buildQuery", () => {
  it("omite valores vazios, nulos ou indefinidos", () => {
    expect(buildQuery({ q: "abc", status: "", priority: undefined, page: null })).toEqual({
      q: "abc",
    });
  });

  it("converte números para string", () => {
    expect(buildQuery({ page: 2, itemsPerPage: 10 })).toEqual({ page: "2", itemsPerPage: "10" });
  });

  it("retorna objeto vazio quando não há filtros ativos", () => {
    expect(buildQuery({})).toEqual({});
  });
});

describe("readQueryParam", () => {
  it("lê uma string simples", () => {
    expect(readQueryParam({ q: "42" }, "q")).toBe("42");
  });

  it("usa o primeiro valor quando a query tem múltiplos valores", () => {
    expect(readQueryParam({ q: ["a", "b"] }, "q")).toBe("a");
  });

  it("retorna undefined para chave ausente ou vazia", () => {
    expect(readQueryParam({}, "q")).toBeUndefined();
    expect(readQueryParam({ q: "" }, "q")).toBeUndefined();
  });
});

describe("readQueryEnum", () => {
  const STATUSES = ["aberto", "em_andamento", "resolvido", "fechado"] as const;

  it("aceita um valor permitido", () => {
    expect(readQueryEnum({ status: "aberto" }, "status", STATUSES)).toBe("aberto");
  });

  it("ignora um valor inválido/inexistente sem quebrar", () => {
    expect(readQueryEnum({ status: "invalido" }, "status", STATUSES)).toBeUndefined();
    expect(readQueryEnum({}, "status", STATUSES)).toBeUndefined();
  });
});

describe("readQueryPositiveInt", () => {
  it("lê um inteiro positivo válido", () => {
    expect(readQueryPositiveInt({ page: "3" }, "page", 1)).toBe(3);
  });

  it("cai no padrão para valores inválidos (texto, zero, negativo, decimal)", () => {
    expect(readQueryPositiveInt({ page: "abc" }, "page", 1)).toBe(1);
    expect(readQueryPositiveInt({ page: "0" }, "page", 1)).toBe(1);
    expect(readQueryPositiveInt({ page: "-2" }, "page", 1)).toBe(1);
    expect(readQueryPositiveInt({ page: "2.5" }, "page", 1)).toBe(1);
  });

  it("cai no padrão quando a chave não está presente", () => {
    expect(readQueryPositiveInt({}, "page", 1)).toBe(1);
  });
});
