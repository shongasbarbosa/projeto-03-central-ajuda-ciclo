import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { api, isDemoMode } from "@/services";
import { getAccessToken, setTokens } from "@/services/api/http";
import { resetDemoState } from "@/services/demo/store";
import type { User } from "@/services/types";
import { useListFiltersStore } from "@/stores/listFilters";

const DEMO_SESSION_KEY = "cac-demo-username";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const ready = ref(false);

  const isAuthenticated = computed(() => user.value !== null);
  const isAgent = computed(() => user.value?.role === "atendente");
  const isStudent = computed(() => user.value?.role === "aluno");

  async function login(username: string, password: string): Promise<void> {
    const result = await api.auth.login(username, password);
    user.value = result.user;
    if (isDemoMode) {
      try {
        sessionStorage.setItem(DEMO_SESSION_KEY, username);
      } catch {
        // ignora falha ao persistir sessão demo
      }
    }
  }

  async function restoreSession(): Promise<void> {
    try {
      if (isDemoMode) {
        const storedUsername = sessionStorage.getItem(DEMO_SESSION_KEY);
        if (storedUsername) {
          const result = await api.auth.login(storedUsername, "");
          user.value = result.user;
        }
      } else if (getAccessToken()) {
        user.value = await api.auth.me();
      }
    } catch {
      user.value = null;
    } finally {
      ready.value = true;
    }
  }

  async function logout(): Promise<void> {
    await api.auth.logout();
    user.value = null;
    setTokens(null, null);
    useListFiltersStore().clearAll();
    if (isDemoMode) {
      resetDemoState();
      try {
        sessionStorage.removeItem(DEMO_SESSION_KEY);
      } catch {
        // ignora falha ao limpar sessão demo
      }
    }
  }

  return { user, ready, isAuthenticated, isAgent, isStudent, login, restoreSession, logout };
});
