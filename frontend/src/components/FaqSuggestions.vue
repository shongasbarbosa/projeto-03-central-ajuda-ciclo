<script setup lang="ts">
import { ref, watch } from "vue";

import { api } from "@/services";
import type { FaqArticle } from "@/services/types";

const props = defineProps<{ query: string; offerId?: number }>();

const suggestions = ref<FaqArticle[]>([]);
const loading = ref(false);
const feedbackGiven = ref<Set<number>>(new Set());

async function fetchSuggestions() {
  if (!props.query.trim()) {
    suggestions.value = [];
    return;
  }
  loading.value = true;
  try {
    suggestions.value = await api.faq.suggestions(props.query, props.offerId);
  } finally {
    loading.value = false;
  }
}

async function sendFeedback(article: FaqArticle, helpful: boolean) {
  await api.faq.feedback(article.id, helpful);
  feedbackGiven.value.add(article.id);
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => [props.query, props.offerId],
  () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchSuggestions, 350);
  },
  { immediate: true }
);
</script>

<template>
  <div v-if="suggestions.length || loading">
    <p class="text-subtitle-2 mb-2">
      Estas respostas podem ajudar antes de abrir um chamado:
    </p>
    <v-list class="cac-surface" density="comfortable" aria-label="Sugestões de FAQ">
      <v-list-item v-for="article in suggestions" :key="article.id">
        <v-list-item-title class="font-weight-600">{{ article.question }}</v-list-item-title>
        <v-list-item-subtitle class="text-wrap">{{ article.answer }}</v-list-item-subtitle>
        <template #append>
          <div v-if="!feedbackGiven.has(article.id)" class="d-flex ga-1">
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
          <span v-else class="text-caption text-medium-emphasis">Obrigado!</span>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>
