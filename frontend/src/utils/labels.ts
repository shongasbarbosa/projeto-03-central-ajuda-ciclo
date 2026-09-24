export const CATEGORY_LABELS: Record<string, string> = {
  acesso: "Acesso",
  matricula: "Matrícula",
  conteudo: "Conteúdo",
  avaliacao: "Avaliação",
  certificado: "Certificado",
  tecnico: "Técnico",
};

export const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

export const CYCLE_PHASE_LABELS: Record<string, string> = {
  matricula: "Matrícula",
  andamento: "Andamento",
  encerramento: "Encerramento",
};

export const STATUS_COLORS: Record<string, string> = {
  aberto: "info",
  em_andamento: "warning",
  resolvido: "success",
  fechado: "surface-variant",
};

export const PRIORITY_COLORS: Record<string, string> = {
  baixa: "success",
  media: "warning",
  alta: "error",
};

export function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export function formatHours(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value < 1) return `${Math.round(value * 60)} min`;
  return `${value.toFixed(1)} h`;
}
