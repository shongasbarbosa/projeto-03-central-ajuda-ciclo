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
          "on-secondary": "#FFFFFF",
          background: "#F5F6FA",
          surface: "#FFFFFF",
          error: "#C4281C",
          "on-error": "#FFFFFF",
          success: "#1E7E34",
          "on-success": "#FFFFFF",
          warning: "#946200",
          "on-warning": "#FFFFFF",
          info: "#0B5FBF",
          "on-info": "#FFFFFF",
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
          "on-secondary": "#0F1230",
          background: "#101319",
          surface: "#181C24",
          error: "#FF8A80",
          "on-error": "#3D0500",
          success: "#7FD99A",
          "on-success": "#0F2A18",
          warning: "#F4C065",
          "on-warning": "#3D2900",
          info: "#7FB0FF",
          "on-info": "#00224D",
        },
      },
    },
  },
  defaults: surfaceDefaults,
});
