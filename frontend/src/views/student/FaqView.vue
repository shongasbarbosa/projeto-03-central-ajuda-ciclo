<script setup lang="ts">
import { onMounted, ref } from "vue";

import FaqTagChips from "@/components/FaqTagChips.vue";
import { useListFilters, type FilterField } from "@/composables/useListFilters";
import { api } from "@/services";
import type { CyclePhase, FaqArticle, TicketCategory } from "@/services/types";
import { CATEGORY_LABELS, CYCLE_PHASE_LABELS } from "@/utils/labels";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TicketCategory[];
const PHASES = Object.keys(CYCLE_PHASE_LABELS) as CyclePhase[];
const categoryItems = Object.entries(CATEGORY_LABELS).map(([value, title]) => ({ value, title }));
const phaseItems = Object.entries(CYCLE_PHASE_LABELS).map(([value, title]) => ({ value, title }));

const articles = ref<FaqArticle[]>([]);
const loading = ref(true);
const feedbackGiven = ref<Set<number>>(new Set());

const FIELDS: FilterField[] = [
  { key: "search", param: "q", type: "text" },
  { key: "category", param: "category", type: "enum", allowed: CATEGORIES },
  { key: "cyclePhase", param: "phase", type: "enum", allowed: PHASES },
];

const { filters, activeFilterCount, clearFilters, init } = useListFilters({
  listKey: "student-faq",
  fields: FIELDS,
  load,
  debounceMs: 300,
});

async function load() {
  loading.value = true;
  try {
    articles.value = await api.faq.list({
      search: filters.search || undefined,
      category: filters.category ?? undefined,
      cycle_phase: filters.cyclePhase ?? undefined,
    });
  } finally {
    loading.value = false;
  }
}

async function sendFeedback(article: FaqArticle, helpful: boolean) {
  await api.faq.feedback(article.id, helpful);
  feedbackGiven.value.add(article.id);
}

onMounted(init);
</script>

<template>
  <div>
    <h1 class="text-h6 mb-4">Perguntas frequentes</h1>

    <v-row dense class="mb-2">
      <v-col cols="12" sm="6" md="5">
        <v-text-field
          v-model="filters.search"
          label="Buscar na FAQ"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" sm="3" md="3">
        <v-select
          v-model="filters.category"
          :items="categoryItems"
          label="Categoria"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" sm="3" md="3">
        <v-select
          v-model="filters.cyclePhase"
          :items="phaseItems"
          label="Fase do ciclo"
          density="compact"
          clearable
        />
      </v-col>
    </v-row>

    <div class="d-flex align-center ga-2 mb-4 flex-wrap">
      <v-chip v-if="activeFilterCount > 0" size="small" color="primary" variant="tonal">
        {{ activeFilterCount }} filtro(s) ativo(s)
      </v-chip>
      <v-btn v-if="activeFilterCount > 0" size="small" variant="text" @click="clearFilters">
        Limpar filtros
      </v-btn>
    </div>

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
