import { useTheme as useVuetifyTheme } from "vuetify";
import { computed } from "vue";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "cac-theme-mode";

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage indisponível (modo privado, storage bloqueado etc.)
  }
  return "system";
}

function systemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useAppTheme() {
  const vuetifyTheme = useVuetifyTheme();

  const mode = computed<ThemeMode>({
    get() {
      return readStoredMode();
    },
    set(value: ThemeMode) {
      applyMode(value);
    },
  });

  function applyMode(value: ThemeMode) {
    const resolved = value === "system" ? (systemPrefersDark() ? "dark" : "light") : value;
    vuetifyTheme.change(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignora falha ao persistir preferência de tema
    }
  }

  function initTheme() {
    applyMode(readStoredMode());
  }

  const isDark = computed(() => vuetifyTheme.global.current.value.dark);

  return { mode, initTheme, isDark };
}
