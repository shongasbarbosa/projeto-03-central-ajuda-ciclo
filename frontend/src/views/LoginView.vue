<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import { isDemoMode } from "@/services";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

async function submit(usernameValue: string, passwordValue: string) {
  errorMessage.value = "";
  loading.value = true;
  try {
    await auth.login(usernameValue, passwordValue);
    await router.replace({ name: "home" });
  } catch {
    errorMessage.value = "Usuário ou senha inválidos.";
  } finally {
    loading.value = false;
  }
}

function handleSubmit() {
  return submit(username.value, password.value);
}
</script>

<template>
  <div class="login-wrapper d-flex align-center justify-center">
    <v-card class="login-card pa-6" max-width="420" width="100%">
      <v-card-title class="text-h6 mb-1">Central de Ajuda por Ciclo</v-card-title>
      <v-card-subtitle class="mb-4">Entre com sua conta para continuar</v-card-subtitle>

      <v-form @submit.prevent="handleSubmit">
        <v-text-field
          v-model="username"
          label="Usuário"
          autocomplete="username"
          class="mb-2"
          :disabled="loading"
        />
        <v-text-field
          v-model="password"
          label="Senha"
          type="password"
          autocomplete="current-password"
          class="mb-2"
          :disabled="loading"
        />

        <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-btn type="submit" color="primary" block size="large" :loading="loading">
          Entrar
        </v-btn>
      </v-form>

      <template v-if="isDemoMode">
        <v-divider class="my-5" />
        <p class="text-caption text-medium-emphasis mb-3">Atalhos do modo demonstração</p>
        <div class="d-flex flex-column ga-2">
          <v-btn
            variant="tonal"
            color="primary"
            block
            :loading="loading"
            @click="submit('aluno.demo', '')"
          >
            Entrar como aluno
          </v-btn>
          <v-btn
            variant="tonal"
            color="secondary"
            block
            :loading="loading"
            @click="submit('atendente.demo', '')"
          >
            Entrar como atendente
          </v-btn>
        </div>
      </template>
    </v-card>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100dvh;
  padding: 24px 16px;
}

.login-card {
  border-radius: var(--cac-radius-lg);
}
</style>
