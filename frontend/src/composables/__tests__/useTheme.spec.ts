import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createVuetify } from "vuetify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useAppTheme } from "../useTheme";

const vuetify = createVuetify();

function mountWithTheme() {
  let exposed!: ReturnType<typeof useAppTheme>;
  const component = defineComponent({
    setup() {
      exposed = useAppTheme();
      return () => null;
    },
  });
  mount(component, { global: { plugins: [vuetify] } });
  return exposed;
}

describe("useAppTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("aplica o tema escuro e persiste no localStorage", () => {
    const theme = mountWithTheme();

    theme.mode.value = "dark";

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("cac-theme-mode")).toBe("dark");
    expect(theme.isDark.value).toBe(true);
  });

  it("aplica o tema claro e persiste no localStorage", () => {
    const theme = mountWithTheme();

    theme.mode.value = "light";

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("cac-theme-mode")).toBe("light");
    expect(theme.isDark.value).toBe(false);
  });

  it("modo sistema não força data-theme para um valor fixo salvo", () => {
    const theme = mountWithTheme();

    theme.mode.value = "system";

    expect(localStorage.getItem("cac-theme-mode")).toBe("system");
  });
});
