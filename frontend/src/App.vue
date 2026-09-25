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
      <div class="cac-content cac-main-container">
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.cac-main-container {
  padding-top: 16px;
  padding-bottom: 16px;
}

@media (max-width: 959.98px) {
  .cac-main-container {
    padding-bottom: 72px;
  }
}
</style>
