<script setup lang="ts">
import { onMounted, ref } from "vue";

import TicketStatusChip from "@/components/TicketStatusChip.vue";
import { api } from "@/services";
import type { TicketListItem } from "@/services/types";
import { CATEGORY_LABELS, formatDateTime } from "@/utils/labels";

const tickets = ref<TicketListItem[]>([]);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    tickets.value = await api.tickets.list();
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h6">Meus chamados</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" :to="{ name: 'student-ticket-new' }">
        Abrir chamado
      </v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-else-if="tickets.length === 0" type="info" variant="tonal">
      Você ainda não abriu nenhum chamado.
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
            <v-card-subtitle>{{ ticket.offer_name }}</v-card-subtitle>
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
