import type {
  ApiService,
  FaqArticle,
  FaqFilters,
  Offer,
  ReportCategoryRow,
  ReportPhaseRow,
  ReportSummary,
  TicketDetail,
  TicketFilters,
  TicketListItem,
  TicketMessage,
  User,
} from "../types";
import { request, setTokens } from "./http";

interface Paginated<T> {
  count: number;
  results: T[];
}

export const realApi: ApiService = {
  auth: {
    async login(username, password) {
      const data = await request<{ access: string; refresh: string; user: User }>(
        "/auth/login",
        { method: "POST", body: { username, password } }
      );
      setTokens(data.access, data.refresh);
      return { access: data.access, user: data.user };
    },
    async me() {
      return request<User>("/auth/me");
    },
    async logout() {
      setTokens(null, null);
    },
  },

  offers: {
    async list() {
      const data = await request<Paginated<Offer>>("/offers");
      return data.results;
    },
  },

  tickets: {
    async list(filters?: TicketFilters) {
      const { search, ...rest } = filters ?? {};
      const data = await request<Paginated<TicketListItem>>("/tickets", {
        params: { ...rest, search },
      });
      return data.results;
    },
    async get(id) {
      return request<TicketDetail>(`/tickets/${id}`);
    },
    async create(payload) {
      return request<TicketDetail>("/tickets", { method: "POST", body: payload });
    },
    async update(id, patch) {
      return request<TicketDetail>(`/tickets/${id}`, { method: "PATCH", body: patch });
    },
    async addMessage(id, data) {
      return request<TicketMessage>(`/tickets/${id}/messages`, { method: "POST", body: data });
    },
  },

  faq: {
    async list(filters?: FaqFilters) {
      const { search, ...rest } = filters ?? {};
      const data = await request<Paginated<FaqArticle>>("/faq", {
        params: { ...rest, search },
      });
      return data.results;
    },
    async suggestions(query, offerId) {
      return request<FaqArticle[]>("/faq/suggestions", {
        params: { query, offer: offerId },
      });
    },
    async feedback(id, helpful) {
      return request<FaqArticle>(`/faq/${id}/feedback`, {
        method: "POST",
        body: { helpful },
      });
    },
    async create(data) {
      return request<FaqArticle>("/faq", { method: "POST", body: data });
    },
    async update(id, patch) {
      return request<FaqArticle>(`/faq/${id}`, { method: "PATCH", body: patch });
    },
    async remove(id) {
      await request<void>(`/faq/${id}`, { method: "DELETE" });
    },
  },

  reports: {
    async ticketsByCyclePhase(offer) {
      return request<ReportPhaseRow[]>("/reports/tickets-by-cycle-phase", {
        params: { offer },
      });
    },
    async avgResolutionTime(category, offer) {
      return request<ReportCategoryRow[]>("/reports/avg-resolution-time", {
        params: { category, offer },
      });
    },
    async summary() {
      return request<ReportSummary>("/reports/summary");
    },
  },
};
