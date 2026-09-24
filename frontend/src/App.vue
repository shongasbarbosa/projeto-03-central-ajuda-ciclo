<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import AppHeader from "@/components/AppHeader.vue";
import DemoModeBanner from "@/components/DemoModeBanner.vue";

const auth = useAuthStore();
</script>

<template>
  <v-app>
    <DemoModeBanner />
    <AppHeader v-if="auth.isAuthenticated" />

    <v-main>
      <v-container class="px-2 px-md-4 cac-main-container" fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
@media (max-width: 959.98px) {
  .cac-main-container {
    padding-bottom: 72px;
  }
}
</style>
