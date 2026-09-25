<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import FaqTagChips from "@/components/FaqTagChips.vue";
import { api } from "@/services";
import type { CyclePhase, FaqArticle, TicketCategory } from "@/services/types";
import { CATEGORY_LABELS, CYCLE_PHASE_LABELS } from "@/utils/labels";
import { buildQuery, readQueryEnum, readQueryParam } from "@/utils/queryFilters";

const route = useRoute();
const router = useRouter();

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TicketCategory[];
const PHASES = Object.keys(CYCLE_PHASE_LABELS) as CyclePhase[];
const categoryItems = Object.entries(CATEGORY_LABELS).map(([value, title]) => ({ value, title }));
const phaseItems = Object.entries(CYCLE_PHASE_LABELS).map(([value, title]) => ({ value, title }));

const articles = ref<FaqArticle[]>([]);
const search = ref("");
const category = ref<TicketCategory | null>(null);
const cyclePhase = ref<CyclePhase | null>(null);
const loading = ref(true);
const feedbackGiven = ref<Set<number>>(new Set());

let restoringFromUrl = false;

function restoreFromRoute() {
  restoringFromUrl = true;
  const query = route.query as Record<string, unknown>;
  search.value = readQueryParam(query, "q") ?? "";
  category.value = readQueryEnum(query, "category", CATEGORIES) ?? null;
  cyclePhase.value = readQueryEnum(query, "phase", PHASES) ?? null;
  nextTick(() => {
    restoringFromUrl = false;
  });
}

const activeFilterCount = computed(() => {
  let count = 0;
  if (search.value) count += 1;
  if (category.value) count += 1;
  if (cyclePhase.value) count += 1;
  return count;
});

function clearFilters() {
  search.value = "";
  category.value = null;
  cyclePhase.value = null;
}

async function load() {
  loading.value = true;
  try {
    articles.value = await api.faq.list({
      search: search.value || undefined,
      category: category.value ?? undefined,
      cycle_phase: cyclePhase.value ?? undefined,
    });
  } finally {
    loading.value = false;
  }
}

async function sendFeedback(article: FaqArticle, helpful: boolean) {
  await api.faq.feedback(article.id, helpful);
  feedbackGiven.value.add(article.id);
}

function syncRoute() {
  if (restoringFromUrl) return;
  router.replace({
    query: buildQuery({
      q: search.value,
      category: category.value ?? undefined,
      phase: cyclePhase.value ?? undefined,
    }),
  });
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch([search, category, cyclePhase], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncRoute();
    load();
  }, 300);
});

onMounted(() => {
  restoreFromRoute();
  load();
});
</script>

<template>
  <div>
    <h1 class="text-h6 mb-4">Perguntas frequentes</h1>

    <v-row dense class="mb-2">
      <v-col cols="12" sm="6" md="5">
        <v-text-field
          v-model="search"
          label="Buscar na FAQ"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" sm="3" md="3">
        <v-select
          v-model="category"
          :items="categoryItems"
          label="Categoria"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" sm="3" md="3">
        <v-select
          v-model="cyclePhase"
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
