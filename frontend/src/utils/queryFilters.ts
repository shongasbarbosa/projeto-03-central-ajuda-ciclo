/**
 * Helpers para sincronizar filtros de lista com a query string da rota
 * (ex.: #/atendente/fila?q=00042-09-2026&status=aberto&page=2), ignorando
 * valores inválidos em vez de quebrar a tela.
 */

export type QueryRecord = Record<string, unknown>;

/** Monta a query string a partir de um objeto de filtros, omitindo valores
 * vazios/nulos/padrão para manter a URL curta. */
export function buildQuery(
  params: Record<string, string | number | null | undefined>
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query[key] = String(value);
  }
  return query;
}

export function readQueryParam(query: QueryRecord, key: string): string | undefined {
  const value = query[key];
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" && first !== "" ? first : undefined;
  }
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Lê um valor da query que precisa estar em uma lista de valores
 * permitidos (ex.: status, categoria); qualquer outro valor é ignorado. */
export function readQueryEnum<T extends string>(
  query: QueryRecord,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const raw = readQueryParam(query, key);
  if (raw && (allowed as readonly string[]).includes(raw)) return raw as T;
  return undefined;
}

/** Lê um número inteiro positivo da query; qualquer outra coisa (texto,
 * negativo, zero, NaN) cai no valor padrão em vez de quebrar a tela. */
export function readQueryPositiveInt(query: QueryRecord, key: string, fallback: number): number {
  const raw = readQueryParam(query, key);
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
