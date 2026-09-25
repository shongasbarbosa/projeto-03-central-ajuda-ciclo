import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

import { createVuetify } from "vuetify";
import { pt } from "vuetify/locale";

const surfaceDefaults = {
  VCard: {
    class: "cac-surface",
    rounded: "lg",
  },
  VSheet: {
    rounded: "lg",
  },
  VDialog: {
    class: "cac-surface",
  },
  VDataTable: {
    class: "cac-surface",
  },
  // Caixa normal (sem uppercase automático) em botões e abas.
  VBtn: {
    class: "text-none",
  },
  VTab: {
    class: "text-none",
  },
};

export const vuetify = createVuetify({
  locale: {
    locale: "pt",
    messages: { pt },
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        dark: false,
        colors: {
          primary: "#1E4FD8",
          "on-primary": "#FFFFFF",
          secondary: "#4A5CC5",
          background: "#F5F6FA",
          surface: "#FFFFFF",
          error: "#C4281C",
          success: "#1E7E34",
          warning: "#946200",
        },
      },
      dark: {
        dark: true,
        colors: {
          // Azul mais escuro (em vez do tom claro anterior) para manter
          // contraste AA com o texto branco dos botões no tema escuro.
          primary: "#3D63ED",
          "on-primary": "#FFFFFF",
          secondary: "#A9B4E8",
          background: "#101319",
          surface: "#181C24",
          error: "#FF8A80",
          success: "#7FD99A",
          warning: "#F4C065",
        },
      },
    },
  },
  defaults: surfaceDefaults,
});
