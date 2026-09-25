<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import ThemeToggle from "@/components/ThemeToggle.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

const navItems = computed(() => {
  if (auth.isAgent) {
    return [
      { to: { name: "agent-queue" }, label: "Fila de chamados", icon: "mdi-ticket-confirmation" },
      { to: { name: "agent-faq" }, label: "FAQ", icon: "mdi-frequently-asked-questions" },
      { to: { name: "agent-reports" }, label: "Relatórios", icon: "mdi-chart-box" },
    ];
  }
  if (auth.isStudent) {
    return [
      { to: { name: "student-tickets" }, label: "Meus chamados", icon: "mdi-ticket-confirmation" },
      { to: { name: "student-faq" }, label: "FAQ", icon: "mdi-frequently-asked-questions" },
    ];
  }
  return [];
});

async function handleLogout() {
  await auth.logout();
  await router.replace({ name: "login" });
}
</script>

<template>
  <v-app-bar :elevation="0">
    <div class="cac-content d-flex align-center">
      <v-app-bar-title class="text-body-1 font-weight-600">
        Central de Ajuda por Ciclo
      </v-app-bar-title>

      <v-tabs v-if="navItems.length" class="d-none d-md-flex" density="comfortable">
        <v-tab
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          :prepend-icon="item.icon"
        >
          {{ item.label }}
        </v-tab>
      </v-tabs>

      <v-spacer />

      <ThemeToggle />

      <v-btn
        v-if="auth.isAuthenticated"
        icon="mdi-logout"
        variant="text"
        aria-label="Sair"
        @click="handleLogout"
      />
    </div>
  </v-app-bar>

  <v-bottom-navigation v-if="navItems.length" class="d-flex d-md-none" grow>
    <v-btn v-for="item in navItems" :key="item.label" :to="item.to" :aria-label="item.label">
      <v-icon :icon="item.icon" />
      <span>{{ item.label }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>
