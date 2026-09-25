import { defineStore } from "pinia";

/**
 * Guarda a última query de filtros de cada lista (fila do atendente, "Meus
 * chamados", FAQ do aluno, gestão de FAQ) por usuário, em sessionStorage,
 * para restaurá-la quando o usuário volta à tela pelo menu (não só pelo
 * botão "voltar" do navegador, que já preserva a URL sozinho).
 *
 * Isolado por usuário (chave = id do usuário) porque a sessão demo troca de
 * usuário sem recarregar a página; os filtros de um perfil não devem
 * "vazar" para o próximo login. Tudo é limpo no logout (ver stores/auth.ts).
 */

const STORAGE_KEY = "cac:list-filters";

type QueryMap = Record<string, string>;
type ListFiltersByUser = Record<string, Record<string, QueryMap>>;

function loadFromStorage(): ListFiltersByUser {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ListFiltersByUser) : {};
  } catch {
    // sessionStorage indisponível (modo privado, quota excedida, SSR etc.):
    // segue sem estado persistido em vez de quebrar a tela.
    return {};
  }
}

function saveToStorage(data: ListFiltersByUser) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Idem: falha ao salvar não deve quebrar a navegação.
  }
}

export const useListFiltersStore = defineStore("listFilters", {
  state: (): { byUser: ListFiltersByUser } => ({
    byUser: loadFromStorage(),
  }),
  actions: {
    getQuery(userId: number | string, listKey: string): QueryMap | undefined {
      return this.byUser[String(userId)]?.[listKey];
    },
    setQuery(userId: number | string, listKey: string, query: QueryMap) {
      const key = String(userId);
      const forUser = { ...(this.byUser[key] ?? {}) };
      forUser[listKey] = query;
      this.byUser = { ...this.byUser, [key]: forUser };
      saveToStorage(this.byUser);
    },
    clearAll() {
      this.byUser = {};
      saveToStorage(this.byUser);
    },
  },
});
