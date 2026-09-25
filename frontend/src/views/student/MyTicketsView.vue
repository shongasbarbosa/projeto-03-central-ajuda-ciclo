<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import TicketStatusChip from "@/components/TicketStatusChip.vue";
import { useListFilters, type FilterField } from "@/composables/useListFilters";
import { api } from "@/services";
import type { TicketListItem, TicketStatus } from "@/services/types";
import { CATEGORY_LABELS, STATUS_LABELS, formatDateTime } from "@/utils/labels";
import { parseCodeQuery } from "@/utils/ticketCode";

const STATUSES = Object.keys(STATUS_LABELS) as TicketStatus[];
const statusItems = Object.entries(STATUS_LABELS).map(([value, title]) => ({ value, title }));

const tickets = ref<TicketListItem[]>([]);
const loading = ref(true);

const FIELDS: FilterField[] = [
  { key: "search", param: "q", type: "text" },
  { key: "status", param: "status", type: "enum", allowed: STATUSES },
];

const { filters, activeFilterCount, clearFilters, init } = useListFilters({
  listKey: "student-my-tickets",
  fields: FIELDS,
  load,
});

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
    });
  } finally {
    loading.value = false;
  }
}

onMounted(init);
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h6">Meus chamados</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'student-ticket-new' }">
        Abrir chamado
      </v-btn>
    </div>

    <v-row dense class="mb-2">
      <v-col cols="12" sm="8" md="6">
        <v-text-field
          v-model="filters.search"
          label="Buscar por assunto, descrição ou código"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <v-select
          v-model="filters.status"
          :items="statusItems"
          label="Status"
          density="compact"
          clearable
        />
      </v-col>
    </v-row>

    <div class="d-flex align-center ga-2 mb-2 flex-wrap">
      <v-chip v-if="activeFilterCount > 0" size="small" color="primary" variant="tonal">
        {{ activeFilterCount }} filtro(s) ativo(s)
      </v-chip>
      <v-btn v-if="activeFilterCount > 0" size="small" variant="text" @click="clearFilters">
        Limpar filtros
      </v-btn>
    </div>

    <v-alert v-if="exactMatch" type="info" variant="tonal" class="mb-4">
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

    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-else-if="tickets.length === 0" type="info" variant="tonal">
      {{
        activeFilterCount > 0
          ? "Nenhum chamado encontrado para os filtros aplicados."
          : "Você ainda não abriu nenhum chamado."
      }}
    </v-alert>

    <v-row v-else>
      <v-col v-for="ticket in tickets" :key="ticket.id" cols="12" md="6" lg="4">
        <v-card
          class="cac-surface cac-surface--interactive h-100"
          :to="{ name: 'ticket-detail', params: { id: ticket.id } }"
          hover
        >
          <v-card-item>
            <v-card-title class="text-body-1">{{ ticket.subject }}</v-card-title>
            <v-card-subtitle>{{ ticket.code }} · {{ ticket.offer_name }}</v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="d-flex ga-2 flex-wrap mb-2">
              <TicketStatusChip :status="ticket.status" />
              <v-chip size="small" variant="outlined">{{ CATEGORY_LABELS[ticket.category] }}</v-chip>
            </div>
            <p class="text-caption text-medium-emphasis mb-0">
              Aberto em {{ formatDateTime(ticket.created_at) }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
