import { computed, nextTick, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";
import { useListFiltersStore } from "@/stores/listFilters";
import { buildQuery, readQueryParam } from "@/utils/queryFilters";

/**
 * Descreve um campo de filtro de uma lista. `text`/`enum` são os filtros
 * "de verdade" (contam no indicador de filtros ativos, são limpos por
 * clearFilters, disparam load() com debounce e resetam `page`); `page` e
 * `sort` são estado de UI da lista (não contam, não são limpos, sincronizam
 * a URL imediatamente sem chamar load() de novo).
 */
export type FilterField =
  | { key: string; param: string; type: "text" }
  | { key: string; param: string; type: "enum"; allowed: readonly string[] }
  | { key: string; param: string; type: "page"; default: number }
  | { key: string; param: string; type: "sort" };

export interface UseListFiltersOptions {
  /** Identifica a tela (ex.: "agent-queue"), usado como chave no store de
   * persistência por usuário. */
  listKey: string;
  fields: FilterField[];
  /** Recarrega a lista com os filtros atuais. */
  load: () => void | Promise<void>;
  debounceMs?: number;
}

type SortEntry = { key: string; order: "asc" | "desc" };

function defaultFor(field: FilterField): unknown {
  switch (field.type) {
    case "text":
      return "";
    case "enum":
      return null;
    case "page":
      return field.default;
    case "sort":
      return [] as SortEntry[];
  }
}

function parseFor(field: FilterField, raw: string | undefined): unknown {
  switch (field.type) {
    case "text":
      return raw ?? "";
    case "enum":
      return raw && field.allowed.includes(raw) ? raw : null;
    case "page": {
      if (raw === undefined) return field.default;
      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : field.default;
    }
    case "sort": {
      if (!raw) return [] as SortEntry[];
      const [key, order] = raw.split(":");
      return key ? [{ key, order: order === "desc" ? "desc" : "asc" }] : [];
    }
  }
}

function serializeFor(field: FilterField, value: unknown): string | number | undefined {
  switch (field.type) {
    case "text":
      return (value as string) || undefined;
    case "enum":
      return (value as string | null) ?? undefined;
    case "page":
      return value !== field.default ? (value as number) : undefined;
    case "sort": {
      const arr = value as SortEntry[];
      return arr[0] ? `${arr[0].key}:${arr[0].order}` : undefined;
    }
  }
}

/**
 * Sincroniza os filtros de uma lista com a query string da rota (para URLs
 * compartilháveis e o botão "voltar" do navegador) e, além disso, guarda a
 * última query em um store Pinia persistido em sessionStorage por usuário,
 * para restaurá-la quando a tela é reaberta pelo menu sem query alguma
 * (onde o "voltar" do navegador não ajuda). Se a rota já chega com algum
 * parâmetro de filtro (link compartilhado), a URL tem prioridade sobre o
 * valor salvo.
 */
export function useListFilters(options: UseListFiltersOptions) {
  const { listKey, fields, load, debounceMs = 250 } = options;
  const route = useRoute();
  const router = useRouter();
  const auth = useAuthStore();
  const filtersStore = useListFiltersStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters = reactive<Record<string, any>>({});
  for (const field of fields) filters[field.key] = defaultFor(field);

  let restoring = false;

  function queryHasAnyFilterParam(query: Record<string, unknown>): boolean {
    return fields.some((f) => readQueryParam(query, f.param) !== undefined);
  }

  function applyQuery(query: Record<string, unknown>) {
    restoring = true;
    for (const field of fields) {
      filters[field.key] = parseFor(field, readQueryParam(query, field.param));
    }
    // O reset acontece só depois que os watchers reativos (assíncronos) já
    // rodaram, senão a flag voltaria a false antes de eles verem o valor.
    nextTick(() => {
      restoring = false;
    });
  }

  function queryFromFilters(): Record<string, string> {
    const raw: Record<string, string | number | undefined> = {};
    for (const field of fields) raw[field.param] = serializeFor(field, filters[field.key]);
    return buildQuery(raw);
  }

  function persist() {
    const userId = auth.user?.id;
    if (userId == null) return;
    filtersStore.setQuery(userId, listKey, queryFromFilters());
  }

  function restoreFromRoute() {
    const currentQuery = route.query as Record<string, unknown>;
    if (queryHasAnyFilterParam(currentQuery)) {
      // Link compartilhado (ou volta do navegador): a URL manda.
      applyQuery(currentQuery);
      persist();
      return;
    }

    const userId = auth.user?.id;
    const saved = userId != null ? filtersStore.getQuery(userId, listKey) : undefined;
    if (saved && Object.keys(saved).length > 0) {
      applyQuery(saved);
      router.replace({ query: saved });
    } else {
      applyQuery(currentQuery);
    }
  }

  function syncRoute() {
    if (restoring) return;
    router.replace({ query: queryFromFilters() });
    persist();
  }

  const filterFields = fields.filter(
    (f): f is Extract<FilterField, { type: "text" | "enum" }> => f.type === "text" || f.type === "enum"
  );
  const pageField = fields.find((f): f is Extract<FilterField, { type: "page" }> => f.type === "page");
  const metaFields = fields.filter((f) => f.type === "page" || f.type === "sort");

  const activeFilterCount = computed(() => {
    let count = 0;
    for (const field of filterFields) {
      const value = filters[field.key];
      const isEmpty = field.type === "text" ? !value : value === null || value === undefined;
      if (!isEmpty) count += 1;
    }
    return count;
  });

  function clearFilters() {
    for (const field of filterFields) filters[field.key] = defaultFor(field);
    if (pageField) filters[pageField.key] = pageField.default;
  }

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  if (filterFields.length > 0) {
    watch(
      filterFields.map((field) => () => filters[field.key]),
      () => {
        if (!restoring && pageField) filters[pageField.key] = pageField.default;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          syncRoute();
          load();
        }, debounceMs);
      }
    );
  }

  if (metaFields.length > 0) {
    watch(
      metaFields.map((field) => () => filters[field.key]),
      () => {
        if (restoring) return;
        syncRoute();
      },
      { deep: true }
    );
  }

  function init() {
    restoreFromRoute();
    load();
  }

  return { filters, activeFilterCount, clearFilters, init };
}
