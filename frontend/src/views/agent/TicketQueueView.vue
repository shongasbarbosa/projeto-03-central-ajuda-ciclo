<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import TicketStatusChip from "@/components/TicketStatusChip.vue";
import { useListFilters, type FilterField } from "@/composables/useListFilters";
import { api } from "@/services";
import type { TicketCategory, TicketListItem, TicketPriority, TicketStatus } from "@/services/types";
import {
  CATEGORY_LABELS,
  CYCLE_PHASE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatDateTime,
} from "@/utils/labels";
import { parseCodeQuery, ticketCodeSortKey } from "@/utils/ticketCode";

const router = useRouter();

const STATUSES = Object.keys(STATUS_LABELS) as TicketStatus[];
const CATEGORIES = Object.keys(CATEGORY_LABELS) as TicketCategory[];
const PRIORITIES = Object.keys(PRIORITY_LABELS) as TicketPriority[];
const PHASES = Object.keys(CYCLE_PHASE_LABELS);

const tickets = ref<TicketListItem[]>([]);
const loading = ref(true);

const FIELDS: FilterField[] = [
  { key: "search", param: "q", type: "text" },
  { key: "status", param: "status", type: "enum", allowed: STATUSES },
  { key: "category", param: "category", type: "enum", allowed: CATEGORIES },
  { key: "priority", param: "priority", type: "enum", allowed: PRIORITIES },
  { key: "cyclePhase", param: "phase", type: "enum", allowed: PHASES },
  { key: "page", param: "page", type: "page", default: 1 },
  { key: "itemsPerPage", param: "perPage", type: "page", default: 10 },
  { key: "sortBy", param: "sort", type: "sort" },
];

const { filters, activeFilterCount, clearFilters, init } = useListFilters({
  listKey: "agent-queue",
  fields: FIELDS,
  load,
});

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
  const codeQuery = parseCodeQuery(filters.search);
  if (!codeQuery || codeQuery.month === undefined || codeQuery.year === undefined) return null;
  if (tickets.value.length !== 1) return null;
  return tickets.value[0];
});

async function load() {
  loading.value = true;
  try {
    tickets.value = await api.tickets.list({
      search: filters.search || undefined,
      status: filters.status ?? undefined,
      category: filters.category ?? undefined,
      priority: filters.priority ?? undefined,
      cycle_phase: filters.cyclePhase ?? undefined,
    });
  } finally {
    loading.value = false;
  }
}

function handleRowClick(_event: unknown, row: { item: TicketListItem }) {
  router.push({ name: "ticket-detail", params: { id: row.item.id } });
}

onMounted(init);
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
          v-model="filters.search"
          label="Buscar (assunto, descrição ou código)"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="filters.status"
          :items="statusItems"
          label="Status"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="filters.category"
          :items="categoryItems"
          label="Categoria"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="filters.priority"
          :items="priorityItems"
          label="Prioridade"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="6" md="2">
        <v-select
          v-model="filters.cyclePhase"
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
      v-model:page="filters.page"
      v-model:items-per-page="filters.itemsPerPage"
      v-model:sort-by="filters.sortBy"
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
