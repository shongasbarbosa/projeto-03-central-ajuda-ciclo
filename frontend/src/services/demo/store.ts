import { reactive } from "vue";

import seed from "@/demo-data/seed.json";
import { computeCyclePhase } from "@/utils/cyclePhase";
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
}

function withComputedPhase(offer: Offer): Offer {
  return { ...offer, cycle_phase: computeCyclePhase(offer.enrollment_end, offer.course_end) };
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
  };
}

export const demoState = reactive<DemoState>(buildInitialState());

export function resetDemoState() {
  Object.assign(demoState, buildInitialState());
}
