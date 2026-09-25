import { ApiError } from "../api/http";
import type {
  ApiService,
  FaqArticle,
  FaqFilters,
  TicketDetail,
  TicketFilters,
  TicketListItem,
  TicketMessage,
  User,
} from "../types";
import { canTransitionTo } from "../types";
import { demoState } from "./store";

function requireUser(): User {
  if (!demoState.currentUser) {
    throw new ApiError(401, { detail: "Não autenticado." });
  }
  return demoState.currentUser;
}

function requireAgent(): User {
  const user = requireUser();
  if (user.role !== "atendente") {
    throw new ApiError(403, { detail: "Permissão negada." });
  }
  return user;
}

function findTicketOr404(id: number): TicketDetail {
  const ticket = demoState.tickets.find((t) => t.id === id);
  if (!ticket) {
    throw new ApiError(404, { detail: "Chamado não encontrado." });
  }
  return ticket;
}

function assertTicketAccess(ticket: TicketDetail, user: User) {
  if (user.role === "atendente") return;
  if (ticket.author.id !== user.id) {
    throw new ApiError(403, { detail: "Você não tem acesso a este chamado." });
  }
}

function visibleMessages(ticket: TicketDetail, user: User): TicketMessage[] {
  if (user.role === "atendente") return ticket.messages;
  return ticket.messages.filter((m) => !m.is_internal_note);
}

function matchesQuery(article: FaqArticle, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = `${article.question} ${article.answer}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export const demoApi: ApiService = {
  auth: {
    async login(username) {
      const user = demoState.users.find((u) => u.username === username);
      if (!user) {
        throw new ApiError(401, { detail: "Usuário de demonstração não encontrado." });
      }
      demoState.currentUser = user;
      return { access: "demo-token", user };
    },
    async me() {
      return requireUser();
    },
    async logout() {
      demoState.currentUser = null;
    },
  },

  offers: {
    async list() {
      return demoState.offers;
    },
  },

  tickets: {
    async list(filters: TicketFilters = {}) {
      const user = requireUser();
      let list = demoState.tickets;

      if (user.role !== "atendente") {
        list = list.filter((t) => t.author.id === user.id);
      }

      if (filters.status) list = list.filter((t) => t.status === filters.status);
      if (filters.category) list = list.filter((t) => t.category === filters.category);
      if (filters.priority) list = list.filter((t) => t.priority === filters.priority);
      if (filters.offer) list = list.filter((t) => t.offer === filters.offer);
      if (filters.cycle_phase) {
        list = list.filter((t) => t.cycle_phase_at_opening === filters.cycle_phase);
      }
      if (filters.assigned_to) {
        list = list.filter((t) => t.assigned_to?.id === filters.assigned_to);
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        list = list.filter(
          (t) =>
            t.subject.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)
        );
      }

      return [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).map(toListItem);
    },

    async get(id) {
      const user = requireUser();
      const ticket = findTicketOr404(id);
      assertTicketAccess(ticket, user);
      return { ...ticket, messages: visibleMessages(ticket, user) };
    },

    async create(payload) {
      const user = requireUser();
      const offer = demoState.offers.find((o) => o.id === payload.offer);
      if (!offer) {
        throw new ApiError(400, { offer: ["Oferta inválida."] });
      }
      const now = new Date().toISOString();
      const ticket: TicketDetail = {
        id: demoState.nextTicketId++,
        author: user,
        offer: offer.id,
        offer_name: offer.name,
        category: payload.category,
        priority: payload.priority,
        status: "aberto",
        subject: payload.subject,
        description: payload.description,
        cycle_phase_at_opening: offer.cycle_phase,
        assigned_to: null,
        created_at: now,
        first_response_at: null,
        resolved_at: null,
        closed_at: null,
        messages: [],
      };
      demoState.tickets.unshift(ticket);
      return ticket;
    },

    async update(id, patch) {
      requireAgent();
      const ticket = findTicketOr404(id);

      if (patch.priority) ticket.priority = patch.priority;
      if (patch.assigned_to !== undefined) {
        ticket.assigned_to = demoState.users.find((u) => u.id === patch.assigned_to) ?? null;
      }
      if (patch.status && patch.status !== ticket.status) {
        if (!canTransitionTo(ticket.status, patch.status)) {
          throw new ApiError(400, {
            status: [`Transição de '${ticket.status}' para '${patch.status}' não é permitida.`],
          });
        }
        const now = new Date().toISOString();
        if (patch.status === "resolvido" && !ticket.resolved_at) ticket.resolved_at = now;
        if (patch.status === "fechado" && !ticket.closed_at) ticket.closed_at = now;
        ticket.status = patch.status;
      }

      return { ...ticket, messages: visibleMessages(ticket, requireUser()) };
    },

    async addMessage(id, data) {
      const user = requireUser();
      const ticket = findTicketOr404(id);
      assertTicketAccess(ticket, user);

      if (data.is_internal_note && user.role !== "atendente") {
        throw new ApiError(400, {
          is_internal_note: ["Somente atendentes podem criar notas internas."],
        });
      }

      const message: TicketMessage = {
        id: demoState.nextMessageId++,
        ticket: ticket.id,
        author: user,
        body: data.body,
        created_at: new Date().toISOString(),
        is_internal_note: data.is_internal_note,
      };
      ticket.messages.push(message);

      if (!message.is_internal_note && message.author.id !== ticket.author.id) {
        if (!ticket.first_response_at) {
          ticket.first_response_at = message.created_at;
        }
      }

      return message;
    },
  },

  faq: {
    async list(filters: FaqFilters = {}) {
      const user = requireUser();
      let list = demoState.faqArticles;
      if (user.role !== "atendente") {
        list = list.filter((a) => a.is_published);
      }
      if (filters.category) list = list.filter((a) => a.category === filters.category);
      if (filters.cycle_phase) list = list.filter((a) => a.cycle_phase === filters.cycle_phase);
      if (filters.search) {
        const terms = filters.search.toLowerCase().split(/\s+/).filter(Boolean);
        list = list.filter((a) => matchesQuery(a, terms));
      }
      return list;
    },

    async suggestions(query, offerId) {
      requireUser();
      let list = demoState.faqArticles.filter((a) => a.is_published);

      if (offerId) {
        const offer = demoState.offers.find((o) => o.id === offerId);
        if (offer) {
          list = list.filter((a) => a.cycle_phase === offer.cycle_phase);
        }
      }

      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (terms.length > 0) {
        list = list.filter((a) => matchesQuery(a, terms));
      }

      return list.slice(0, 5);
    },

    async feedback(id, helpful) {
      requireUser();
      const article = demoState.faqArticles.find((a) => a.id === id);
      if (!article) throw new ApiError(404, { detail: "Artigo não encontrado." });
      if (helpful) article.helpful_count += 1;
      else article.not_helpful_count += 1;
      return article;
    },

    async create(data) {
      requireAgent();
      const article: FaqArticle = {
        ...data,
        id: demoState.nextFaqId++,
        view_count: 0,
        helpful_count: 0,
        not_helpful_count: 0,
      };
      demoState.faqArticles.push(article);
      return article;
    },

    async update(id, patch) {
      requireAgent();
      const article = demoState.faqArticles.find((a) => a.id === id);
      if (!article) throw new ApiError(404, { detail: "Artigo não encontrado." });
      Object.assign(article, patch);
      return article;
    },

    async remove(id) {
      requireAgent();
      const index = demoState.faqArticles.findIndex((a) => a.id === id);
      if (index >= 0) demoState.faqArticles.splice(index, 1);
    },
  },

  reports: {
    async ticketsByCyclePhase(offer) {
      requireAgent();
      let tickets = demoState.tickets;
      if (offer) tickets = tickets.filter((t) => t.offer === offer);

      const phases: Array<"matricula" | "andamento" | "encerramento"> = [
        "matricula",
        "andamento",
        "encerramento",
      ];
      return phases.map((phase) => {
        const inPhase = tickets.filter((t) => t.cycle_phase_at_opening === phase);
        const resolved = inPhase.filter((t) => t.resolved_at);
        return {
          cycle_phase: phase,
          total: inPhase.length,
          avg_resolution_hours: averageHours(resolved.map((t) => resolutionHours(t))),
        };
      });
    },

    async ticketsByPriority(offer) {
      requireAgent();
      let tickets = demoState.tickets;
      if (offer) tickets = tickets.filter((t) => t.offer === offer);

      const byPriority = new Map<string, number>();
      for (const ticket of tickets) {
        byPriority.set(ticket.priority, (byPriority.get(ticket.priority) ?? 0) + 1);
      }

      return Array.from(byPriority.entries())
        .map(([priority, total]) => ({ priority: priority as TicketDetail["priority"], total }))
        .sort((a, b) => a.priority.localeCompare(b.priority));
    },

    async avgResolutionTime(category, offer) {
      requireAgent();
      let tickets = demoState.tickets.filter((t) => t.resolved_at);
      if (category) tickets = tickets.filter((t) => t.category === category);
      if (offer) tickets = tickets.filter((t) => t.offer === offer);

      const byCategory = new Map<string, TicketDetail[]>();
      for (const ticket of tickets) {
        const list = byCategory.get(ticket.category) ?? [];
        list.push(ticket);
        byCategory.set(ticket.category, list);
      }

      return Array.from(byCategory.entries()).map(([cat, list]) => ({
        category: cat as TicketDetail["category"],
        total: list.length,
        avg_resolution_hours: averageHours(list.map(resolutionHours)),
      }));
    },

    async summary() {
      requireAgent();
      const tickets = demoState.tickets;
      const byStatus: Record<string, number> = {};
      for (const ticket of tickets) {
        byStatus[ticket.status] = (byStatus[ticket.status] ?? 0) + 1;
      }

      const firstResponseHours = tickets
        .filter((t) => t.first_response_at)
        .map((t) => hoursBetween(t.created_at, t.first_response_at as string));
      const resolutionHoursList = tickets.filter((t) => t.resolved_at).map(resolutionHours);

      return {
        total_tickets: tickets.length,
        by_status: byStatus,
        avg_first_response_hours: averageHours(firstResponseHours),
        avg_resolution_hours: averageHours(resolutionHoursList),
      };
    },
  },
};

function toListItem(ticket: TicketDetail): TicketListItem {
  return {
    id: ticket.id,
    author: ticket.author,
    offer: ticket.offer,
    offer_name: ticket.offer_name,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    subject: ticket.subject,
    cycle_phase_at_opening: ticket.cycle_phase_at_opening,
    assigned_to: ticket.assigned_to,
    created_at: ticket.created_at,
    first_response_at: ticket.first_response_at,
    resolved_at: ticket.resolved_at,
    closed_at: ticket.closed_at,
  };
}

function hoursBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 3_600_000;
}

function resolutionHours(ticket: TicketDetail): number {
  return hoursBetween(ticket.created_at, ticket.resolved_at as string);
}

function averageHours(values: number[]): number | null {
  if (values.length === 0) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg * 100) / 100;
}
