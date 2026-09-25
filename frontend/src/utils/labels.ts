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

export const CATEGORY_COLORS: Record<string, string> = {
  acesso: "primary",
  matricula: "secondary",
  conteudo: "success",
  avaliacao: "warning",
  certificado: "info",
  tecnico: "error",
};

export const CATEGORY_ICONS: Record<string, string> = {
  acesso: "mdi-lock-outline",
  matricula: "mdi-school-outline",
  conteudo: "mdi-book-open-variant",
  avaliacao: "mdi-clipboard-check-outline",
  certificado: "mdi-certificate-outline",
  tecnico: "mdi-wrench-outline",
};

export const CYCLE_PHASE_COLORS: Record<string, string> = {
  matricula: "info",
  andamento: "warning",
  encerramento: "surface-variant",
};

export const CYCLE_PHASE_ICONS: Record<string, string> = {
  matricula: "mdi-calendar-start-outline",
  andamento: "mdi-progress-clock",
  encerramento: "mdi-calendar-end-outline",
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

const integerFormatter = new Intl.NumberFormat("pt-BR");
const oneDecimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return integerFormatter.format(value);
}

export function formatOneDecimal(value: number): string {
  return oneDecimalFormatter.format(value);
}

export function formatHours(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (value < 1) return `${formatNumber(Math.round(value * 60))} min`;
  return `${formatOneDecimal(value)} h`;
}
