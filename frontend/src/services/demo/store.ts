import { reactive } from "vue";

import seed from "@/demo-data/seed.json";
import { computeCyclePhase } from "@/utils/cyclePhase";
import { formatTicketCode } from "@/utils/ticketCode";
import type { FaqArticle, Offer, TicketDetail, User } from "../types";

interface DemoState {
  offers: Offer[];
  tickets: TicketDetail[];
  faqArticles: FaqArticle[];
  users: User[];
  currentUser: User | null;
  nextTicketId: number;
  nextMessageId: number;
  nextFaqId: number;
  codeCounters: Record<string, number>;
}

function withComputedPhase(offer: Offer): Offer {
  return { ...offer, cycle_phase: computeCyclePhase(offer.enrollment_end, offer.course_end) };
}

function initCodeCounters(tickets: TicketDetail[]): Record<string, number> {
  const counters: Record<string, number> = {};
  for (const ticket of tickets) {
    const match = /^(\d{5})-(\d{2})-(\d{4})$/.exec(ticket.code ?? "");
    if (!match) continue;
    const [, sequenceText, month, year] = match;
    const key = `${year}-${month}`;
    counters[key] = Math.max(counters[key] ?? 0, Number(sequenceText));
  }
  return counters;
}

function buildInitialState(): DemoState {
  const offers = (seed.offers as Offer[]).map(withComputedPhase);
  const tickets = structuredClone(seed.tickets) as TicketDetail[];
  const faqArticles = structuredClone(seed.faqArticles) as FaqArticle[];
  const users = structuredClone(seed.users) as User[];

  const maxTicketId = Math.max(0, ...tickets.map((t) => t.id));
  const maxMessageId = Math.max(0, ...tickets.flatMap((t) => t.messages.map((m) => m.id)));
  const maxFaqId = Math.max(0, ...faqArticles.map((f) => f.id));

  return {
    offers,
    tickets,
    faqArticles,
    users,
    currentUser: null,
    nextTicketId: maxTicketId + 1,
    nextMessageId: maxMessageId + 1,
    nextFaqId: maxFaqId + 1,
    codeCounters: initCodeCounters(tickets),
  };
}

export const demoState = reactive<DemoState>(buildInitialState());

export function resetDemoState() {
  Object.assign(demoState, buildInitialState());
}

/** Gera o próximo código de chamado para o mês atual (hora local do
 * navegador), reiniciando o sequencial a cada mês — mesma regra do
 * backend (ver backend/tickets/code.py), sem a conversão de fuso horário
 * do servidor, que não se aplica ao modo demonstração. */
export function generateDemoTicketCode(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const nextSequence = (demoState.codeCounters[key] ?? 0) + 1;
  demoState.codeCounters[key] = nextSequence;
  return formatTicketCode(nextSequence, month, year);
}
