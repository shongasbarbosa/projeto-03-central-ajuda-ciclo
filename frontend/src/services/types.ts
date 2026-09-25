export type Role = "aluno" | "atendente";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
}

export type CyclePhase = "matricula" | "andamento" | "encerramento";

export interface Offer {
  id: number;
  name: string;
  course_name: string;
  category: string;
  enrollment_start: string;
  enrollment_end: string;
  course_start: string;
  course_end: string;
  cycle_phase: CyclePhase;
}

export type TicketCategory =
  | "acesso"
  | "matricula"
  | "conteudo"
  | "avaliacao"
  | "certificado"
  | "tecnico";

export type TicketPriority = "baixa" | "media" | "alta";

export type TicketStatus = "aberto" | "em_andamento" | "resolvido" | "fechado";

export interface TicketMessage {
  id: number;
  ticket: number;
  author: User;
  body: string;
  created_at: string;
  is_internal_note: boolean;
}

export interface TicketListItem {
  id: number;
  author: User;
  offer: number;
  offer_name: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  cycle_phase_at_opening: CyclePhase;
  assigned_to: User | null;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketDetail extends TicketListItem {
  description: string;
  messages: TicketMessage[];
}

export interface FaqArticle {
  id: number;
  question: string;
  answer: string;
  category: TicketCategory;
  cycle_phase: CyclePhase;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  is_published: boolean;
}

export interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  offer?: number;
  cycle_phase?: CyclePhase;
  assigned_to?: number;
  search?: string;
}

export interface FaqFilters {
  category?: TicketCategory;
  cycle_phase?: CyclePhase;
  search?: string;
}

export interface ReportPhaseRow {
  cycle_phase: CyclePhase;
  total: number;
  avg_resolution_hours: number | null;
}

export interface ReportCategoryRow {
  category: TicketCategory;
  total: number;
  avg_resolution_hours: number | null;
}

export interface ReportPriorityRow {
  priority: TicketPriority;
  total: number;
}

export interface ReportSummary {
  total_tickets: number;
  by_status: Record<string, number>;
  avg_first_response_hours: number | null;
  avg_resolution_hours: number | null;
}

export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  aberto: ["em_andamento", "resolvido"],
  em_andamento: ["resolvido", "aberto"],
  resolvido: ["fechado", "em_andamento"],
  fechado: [],
};

export function canTransitionTo(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true;
  return TICKET_STATUS_TRANSITIONS[from].includes(to);
}

export interface ApiService {
  auth: {
    login(username: string, password: string): Promise<{ access: string; user: User }>;
    me(): Promise<User>;
    logout(): Promise<void>;
  };
  offers: {
    list(): Promise<Offer[]>;
  };
  tickets: {
    list(filters?: TicketFilters): Promise<TicketListItem[]>;
    get(id: number): Promise<TicketDetail>;
    create(data: {
      offer: number;
      category: TicketCategory;
      priority: TicketPriority;
      subject: string;
      description: string;
    }): Promise<TicketDetail>;
    update(
      id: number,
      patch: Partial<{ status: TicketStatus; priority: TicketPriority; assigned_to: number | null }>
    ): Promise<TicketDetail>;
    addMessage(
      id: number,
      data: { body: string; is_internal_note: boolean }
    ): Promise<TicketMessage>;
  };
  faq: {
    list(filters?: FaqFilters): Promise<FaqArticle[]>;
    suggestions(query: string, offerId?: number): Promise<FaqArticle[]>;
    feedback(id: number, helpful: boolean): Promise<FaqArticle>;
    create(data: Omit<FaqArticle, "id" | "view_count" | "helpful_count" | "not_helpful_count">): Promise<FaqArticle>;
    update(id: number, patch: Partial<FaqArticle>): Promise<FaqArticle>;
    remove(id: number): Promise<void>;
  };
  reports: {
    ticketsByCyclePhase(offer?: number): Promise<ReportPhaseRow[]>;
    ticketsByPriority(offer?: number): Promise<ReportPriorityRow[]>;
    avgResolutionTime(category?: TicketCategory, offer?: number): Promise<ReportCategoryRow[]>;
    summary(): Promise<ReportSummary>;
  };
}
