/**
 * Código de protocolo do chamado: NNNNN-MM-AAAA (ex.: 00042-09-2026).
 * Espelha a lógica de backend/tickets/code.py para o modo demonstração e
 * para interpretar buscas no frontend.
 */

export function formatTicketCode(sequence: number, month: number, year: number): string {
  return `${String(sequence).padStart(5, "0")}-${String(month).padStart(2, "0")}-${year}`;
}

export interface CodeQuery {
  sequence: number;
  month?: number;
  year?: number;
}

/**
 * Interpreta uma busca por código de chamado. Aceita o código completo (com
 * ou sem zeros à esquerda, com "-", "/" ou espaço como separador), "número
 * -mês" sem o ano, ou só o número (com ou sem o prefixo "#"). Retorna null
 * se o texto não parecer uma busca por código.
 */
export function parseCodeQuery(raw: string): CodeQuery | null {
  const text = raw.trim();
  if (!text) return null;

  const withoutHash = text.startsWith("#") ? text.slice(1) : text;
  const normalized = withoutHash.replace(/[\s/]+/g, "-");
  const parts = normalized.split("-").filter((p) => p !== "");

  if (!parts.every((p) => /^\d+$/.test(p))) return null;

  if (parts.length === 3) {
    const [sequence, month, year] = parts.map(Number);
    if (month < 1 || month > 12 || year < 1000) return null;
    return { sequence, month, year };
  }

  if (parts.length === 2) {
    const [sequence, month] = parts.map(Number);
    if (month < 1 || month > 12) return null;
    return { sequence, month };
  }

  if (parts.length === 1) {
    return { sequence: Number(parts[0]) };
  }

  return null;
}

/** Chave numérica para ordenar/comparar códigos cronologicamente (não
 * alfabeticamente): "00001-10-2026" viria antes de "00042-09-2026" em
 * ordem de texto, mas outubro é depois de setembro. */
export function ticketCodeSortKey(code: string): number {
  const match = /^(\d{5})-(\d{2})-(\d{4})$/.exec(code);
  if (!match) return 0;
  const [, sequence, month, year] = match;
  return Number(year) * 1_000_000 + Number(month) * 100_000 + Number(sequence);
}
