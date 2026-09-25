<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import TicketStatusChip from "@/components/TicketStatusChip.vue";
import { api } from "@/services";
import type { TicketCategory, TicketListItem, TicketPriority, TicketStatus } from "@/services/types";
import {
  CATEGORY_LABELS,
  CYCLE_PHASE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatDateTime,
} from "@/utils/labels";
import { buildQuery, readQueryEnum, readQueryParam, readQueryPositiveInt } from "@/utils/queryFilters";
import { parseCodeQuery, ticketCodeSortKey } from "@/utils/ticketCode";

const route = useRoute();
const router = useRouter();

const STATUSES = Object.keys(STATUS_LABELS) as TicketStatus[];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as TicketCategory[];
const PRIORITIES = Object.keys(PRIORITY_LABELS) as TicketPriority[];
const PHASES = Object.keys(CYCLE_PHASE_LABELS);

const tickets = ref<TicketListItem[]>([]);
const loading = ref(true);

const search = ref("");
const status = ref<TicketStatus | null>(null);
const category = ref<TicketCategory | null>(null);
const priority = ref<TicketPriority | null>(null);
const cyclePhase = ref<string | null>(null);
const page = ref(1);
const itemsPerPage = ref(10);
const sortBy = ref<{ key: string; order: "asc" | "desc" }[]>([]);

let restoringFromUrl = false;

function restoreFromRoute() {
  restoringFromUrl = true;
  const query = route.query as Record<string, unknown>;
  search.value = readQueryParam(query, "q") ?? "";
  status.value = readQueryEnum(query, "status", STATUSES) ?? null;
  category.value = readQueryEnum(query, "category", CATEGORIES) ?? null;
  priority.value = readQueryEnum(query, "priority", PRIORITIES) ?? null;
  cyclePhase.value = readQueryEnum(query, "phase", PHASES) ?? null;
  page.value = readQueryPositiveInt(query, "page", 1);
  itemsPerPage.value = readQueryPositiveInt(query, "perPage", 10);

  const sortRaw = readQueryParam(query, "sort");
  if (sortRaw) {
    const [key, order] = sortRaw.split(":");
    sortBy.value = key ? [{ key, order: order === "desc" ? "desc" : "asc" }] : [];
  } else {
    sortBy.value = [];
  }
  // O reset acontece só depois que os watchers reativos (assíncronos) já
  // rodaram, senão a flag voltaria a false antes de eles verem o valor.
  nextTick(() => {
    restoringFromUrl = false;
  });
}

const activeFilterCount = computed(() => {
  let count = 0;
  if (search.value) count += 1;
  if (status.value) count += 1;
  if (category.value) count += 1;
  if (priority.value) count += 1;
  if (cyclePhase.value) count += 1;
  return count;
});

function clearFilters() {
  search.value = "";
  status.value = null;
  category.value = null;
  priority.value = null;
  cyclePhase.value = null;
  page.value = 1;
}

const statusItems = Object.entries(STATUS_LABELS).map(([value, title]) => ({ value, title }));
const categoryItems = Object.entries(CATEGORY_LABELS).map(([value, title]) => ({ value, title }));
const priorityItems = Object.entries(PRIORITY_LABELS).map(([value, title]) => ({ value, title }));
const phaseItems = Object.entries(CYCLE_PHASE_LABELS).map(([value, title]) => ({ value, title }));

const headers = [
  { title: "Código", key: "codeSort", value: "codeSort" },
  { title: "Assunto", key: "subject" },
  { title: "Aluno", key: "author" },
  { title: "Categoria", key: "category" },
  { title: "Prioridade", key: "priority" },
  { title: "Status", key: "status" },
  { title: "Aberto em", key: "created_at" },
];

const rows = computed(() =>
  tickets.value.map((t) => ({ ...t, codeSort: ticketCodeSortKey(t.code) }))
);

// Quando a busca corresponde exatamente a um único código, destaca o
// chamado em vez de deixá-lo perdido no meio da tabela.
const exactMatch = computed(() => {
  const codeQuery = parseCodeQuery(search.value);
  if (!codeQuery || codeQuery.month === undefined || codeQuery.year === undefined) return null;
  if (tickets.value.length !== 1) return null;
  return tickets.value[0];
});

async function load() {
  loading.value = true;
  try {
    tickets.value = await api.tickets.list({
      search: search.value || undefined,
      status: status.value ?? undefined,
      category: category.value ?? undefined,
      priority: priority.value ?? undefined,
      cycle_phase: (cyclePhase.value as never) ?? undefined,
    });
  } finally {
    loading.value = false;
  }
}

function syncRoute() {
  if (restoringFromUrl) return;
  const sortParam = sortBy.value[0] ? `${sortBy.value[0].key}:${sortBy.value[0].order}` : undefined;
  router.replace({
    query: buildQuery({
      q: search.value,
      status: status.value ?? undefined,
      category: category.value ?? undefined,
      priority: priority.value ?? undefined,
      phase: cyclePhase.value ?? undefined,
      page: page.value !== 1 ? page.value : undefined,
      perPage: itemsPerPage.value !== 10 ? itemsPerPage.value : undefined,
      sort: sortParam,
    }),
  });
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch([search, status, category, priority, cyclePhase], () => {
  if (!restoringFromUrl) page.value = 1;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    syncRoute();
    load();
  }, 250);
});

watch([page, itemsPerPage, sortBy], () => {
  if (restoringFromUrl) return;
  syncRoute();
});

function handleRowClick(_event: unknown, row: { item: TicketListItem }) {
  router.push({ name: "ticket-detail", params: { id: row.item.id } });
}

onMounted(() => {
  restoreFromRoute();
  load();
});
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h6">Fila de chamados</h1>
      <v-chip v-if="activeFilterCount > 0" size="small" color="primary" variant="tonal">
        {{ activeFilterCount }} filtro(s) ativo(s)
      </v-chip>
    </div>

    <v-row class="mb-2" dense>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Buscar (assunto, descrição ou código)"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select v-model="status" :items="statusItems" label="Status" density="compact" clearable />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="category"
          :items="categoryItems"
          label="Categoria"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="priority"
          :items="priorityItems"
          label="Prioridade"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="cyclePhase"
          :items="phaseItems"
          label="Fase do ciclo"
          density="compact"
          clearable
        />
      </v-col>
    </v-row>

    <div class="d-flex justify-end mb-2">
      <v-btn v-if="activeFilterCount > 0" size="small" variant="text" @click="clearFilters">
        Limpar filtros
      </v-btn>
    </div>

    <v-alert v-if="exactMatch" type="info" variant="tonal" class="mb-2">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <span>Chamado <strong>{{ exactMatch.code }}</strong> encontrado: {{ exactMatch.subject }}</span>
        <v-btn
          size="small"
          color="primary"
          :to="{ name: 'ticket-detail', params: { id: exactMatch.id } }"
        >
          Abrir chamado
        </v-btn>
      </div>
    </v-alert>

    <v-data-table
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="rows"
      :loading="loading"
      item-value="id"
      class="cac-surface"
      @click:row="handleRowClick"
    >
      <template #item.codeSort="{ item }">{{ item.code }}</template>
      <template #item.author="{ item }">{{ item.author.first_name }} {{ item.author.last_name }}</template>
      <template #item.category="{ item }">{{ CATEGORY_LABELS[item.category] }}</template>
      <template #item.priority="{ item }">{{ PRIORITY_LABELS[item.priority] }}</template>
      <template #item.status="{ item }"><TicketStatusChip :status="item.status" /></template>
      <template #item.created_at="{ item }">{{ formatDateTime(item.created_at) }}</template>
    </v-data-table>
  </div>
</template>
