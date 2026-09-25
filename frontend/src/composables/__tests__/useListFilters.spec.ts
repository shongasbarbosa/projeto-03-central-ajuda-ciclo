import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { defineComponent, nextTick } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";
import { useListFiltersStore } from "@/stores/listFilters";

import { useListFilters, type FilterField } from "../useListFilters";

const STATUSES = ["aberto", "resolvido"] as const;

async function mountFilters(fields: FilterField[], initialPath = "/fila", load = vi.fn()) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div />" } }],
  });
  await router.push(initialPath);

  let exposed!: ReturnType<typeof useListFilters>;
  const component = defineComponent({
    setup() {
      exposed = useListFilters({ listKey: "test-list", fields, load, debounceMs: 1 });
      exposed.init();
      return () => null;
    },
  });

  mount(component, { global: { plugins: [router] } });
  await nextTick();
  await flushPromises();
  return { filters: exposed, router, load };
}

describe("useListFilters", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("lê os filtros da URL quando a rota já chega com query", async () => {
    const fields: FilterField[] = [
      { key: "search", param: "q", type: "text" },
      { key: "status", param: "status", type: "enum", allowed: STATUSES },
    ];
    const { filters } = await mountFilters(fields, "/fila?q=abc&status=resolvido");

    expect(filters.filters.search).toBe("abc");
    expect(filters.filters.status).toBe("resolvido");
  });

  it("ignora valores inválidos na URL em vez de quebrar", async () => {
    const fields: FilterField[] = [
      { key: "status", param: "status", type: "enum", allowed: STATUSES },
    ];
    const { filters } = await mountFilters(fields, "/fila?status=nao-existe");

    expect(filters.filters.status).toBeNull();
  });

  it("restaura a última query salva quando a rota chega sem query", async () => {
    const auth = useAuthStore();
    // @ts-expect-error -- só id é necessário para o teste
    auth.user = { id: 7 };
    useListFiltersStore().setQuery(7, "test-list", { q: "abc" });

    const fields: FilterField[] = [{ key: "search", param: "q", type: "text" }];
    const { filters, router } = await mountFilters(fields, "/fila");

    expect(filters.filters.search).toBe("abc");
    expect(router.currentRoute.value.query.q).toBe("abc");
  });

  it("a URL tem prioridade sobre a query salva quando a rota já vem com filtros", async () => {
    const auth = useAuthStore();
    // @ts-expect-error -- só id é necessário para o teste
    auth.user = { id: 7 };
    useListFiltersStore().setQuery(7, "test-list", { q: "salvo" });

    const fields: FilterField[] = [{ key: "search", param: "q", type: "text" }];
    const { filters } = await mountFilters(fields, "/fila?q=da-url");

    expect(filters.filters.search).toBe("da-url");
  });

  it("isola a query salva por usuário", () => {
    const store = useListFiltersStore();
    store.setQuery(1, "test-list", { q: "aluno-1" });
    store.setQuery(2, "test-list", { q: "aluno-2" });

    expect(store.getQuery(1, "test-list")).toEqual({ q: "aluno-1" });
    expect(store.getQuery(2, "test-list")).toEqual({ q: "aluno-2" });
  });

  it("persiste em sessionStorage e sobrevive à recriação do store (nova navegação)", () => {
    useListFiltersStore().setQuery(9, "test-list", { q: "persistido" });

    // Simula uma nova montagem do app lendo o sessionStorage do zero.
    setActivePinia(createPinia());
    const reloaded = useListFiltersStore();

    expect(reloaded.getQuery(9, "test-list")).toEqual({ q: "persistido" });
  });

  it("clearAll remove os filtros salvos de todos os usuários (logout)", () => {
    const store = useListFiltersStore();
    store.setQuery(1, "test-list", { q: "aluno-1" });

    store.clearAll();

    expect(store.getQuery(1, "test-list")).toBeUndefined();
  });

  it("clearFilters volta os campos filtráveis ao padrão e reseta a página", async () => {
    const fields: FilterField[] = [
      { key: "search", param: "q", type: "text" },
      { key: "page", param: "page", type: "page", default: 1 },
    ];
    const { filters } = await mountFilters(fields, "/fila?q=abc&page=3");

    expect(filters.filters.search).toBe("abc");
    expect(filters.filters.page).toBe(3);

    filters.clearFilters();

    expect(filters.filters.search).toBe("");
    expect(filters.filters.page).toBe(1);
  });

  it("activeFilterCount conta só os campos text/enum preenchidos", async () => {
    const fields: FilterField[] = [
      { key: "search", param: "q", type: "text" },
      { key: "status", param: "status", type: "enum", allowed: STATUSES },
      { key: "page", param: "page", type: "page", default: 1 },
    ];
    const { filters } = await mountFilters(fields, "/fila?q=abc&page=3");

    expect(filters.activeFilterCount.value).toBe(1);
  });
});
