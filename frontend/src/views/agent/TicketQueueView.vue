<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

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

const router = useRouter();
const tickets = ref<TicketListItem[]>([]);
const loading = ref(true);
const search = ref("");
const status = ref<TicketStatus | null>(null);
const category = ref<TicketCategory | null>(null);
const priority = ref<TicketPriority | null>(null);
const cyclePhase = ref<string | null>(null);

const statusItems = Object.entries(STATUS_LABELS).map(([value, title]) => ({ value, title }));
const categoryItems = Object.entries(CATEGORY_LABELS).map(([value, title]) => ({ value, title }));
const priorityItems = Object.entries(PRIORITY_LABELS).map(([value, title]) => ({ value, title }));
const phaseItems = Object.entries(CYCLE_PHASE_LABELS).map(([value, title]) => ({ value, title }));

const headers = [
  { title: "Assunto", key: "subject" },
  { title: "Aluno", key: "author" },
  { title: "Categoria", key: "category" },
  { title: "Prioridade", key: "priority" },
  { title: "Status", key: "status" },
  { title: "Aberto em", key: "created_at" },
];

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

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch([search, status, category, priority, cyclePhase], () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(load, 250);
});

function handleRowClick(_event: unknown, row: { item: TicketListItem }) {
  router.push({ name: "ticket-detail", params: { id: row.item.id } });
}

onMounted(load);
</script>

<template>
  <div>
    <h1 class="text-h6 mb-4">Fila de chamados</h1>

    <v-row class="mb-2" dense>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Buscar"
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

    <v-data-table
      :headers="headers"
      :items="tickets"
      :loading="loading"
      item-value="id"
      class="cac-surface"
      @click:row="handleRowClick"
    >
      <template #item.author="{ item }">{{ item.author.first_name }} {{ item.author.last_name }}</template>
      <template #item.category="{ item }">{{ CATEGORY_LABELS[item.category] }}</template>
      <template #item.priority="{ item }">{{ PRIORITY_LABELS[item.priority] }}</template>
      <template #item.status="{ item }"><TicketStatusChip :status="item.status" /></template>
      <template #item.created_at="{ item }">{{ formatDateTime(item.created_at) }}</template>
    </v-data-table>
  </div>
</template>
