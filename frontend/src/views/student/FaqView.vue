<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

import FaqTagChips from "@/components/FaqTagChips.vue";
import { api } from "@/services";
import type { FaqArticle } from "@/services/types";

const articles = ref<FaqArticle[]>([]);
const search = ref("");
const loading = ref(true);
const feedbackGiven = ref<Set<number>>(new Set());

async function load() {
  loading.value = true;
  try {
    articles.value = await api.faq.list({ search: search.value || undefined });
  } finally {
    loading.value = false;
  }
}

async function sendFeedback(article: FaqArticle, helpful: boolean) {
  await api.faq.feedback(article.id, helpful);
  feedbackGiven.value.add(article.id);
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 300);
});

onMounted(load);
</script>

<template>
  <div>
    <h1 class="text-h6 mb-4">Perguntas frequentes</h1>

    <v-text-field
      v-model="search"
      label="Buscar na FAQ"
      prepend-inner-icon="mdi-magnify"
      class="mb-4"
      clearable
    />

    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-else-if="articles.length === 0" type="info" variant="tonal">
      Nenhum artigo encontrado.
    </v-alert>

    <v-expansion-panels v-else variant="accordion" class="cac-surface">
      <v-expansion-panel v-for="article in articles" :key="article.id">
        <v-expansion-panel-title>
          <div>
            <div>{{ article.question }}</div>
            <FaqTagChips
              class="mt-1"
              :category="article.category"
              :cycle-phase="article.cycle_phase"
            />
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <p>{{ article.answer }}</p>
          <div v-if="!feedbackGiven.has(article.id)" class="d-flex align-center ga-2">
            <span class="text-caption">Essa resposta ajudou?</span>
            <v-btn
              icon="mdi-thumb-up-outline"
              size="small"
              variant="text"
              aria-label="Marcar como útil"
              @click="sendFeedback(article, true)"
            />
            <v-btn
              icon="mdi-thumb-down-outline"
              size="small"
              variant="text"
              aria-label="Marcar como não útil"
              @click="sendFeedback(article, false)"
            />
          </div>
          <span v-else class="text-caption text-medium-emphasis">Obrigado pelo retorno!</span>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
