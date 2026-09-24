<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import TicketStatusChip from "@/components/TicketStatusChip.vue";
import { api } from "@/services";
import type { TicketDetail, TicketStatus } from "@/services/types";
import { canTransitionTo } from "@/services/types";
import { useAuthStore } from "@/stores/auth";
import {
  CATEGORY_LABELS,
  CYCLE_PHASE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatDateTime,
} from "@/utils/labels";

const props = defineProps<{ id: number }>();
const auth = useAuthStore();

const ticket = ref<TicketDetail | null>(null);
const loading = ref(true);
const notFoundOrForbidden = ref(false);

const replyBody = ref("");
const isInternalNote = ref(false);
const sending = ref(false);
const updating = ref(false);

const statusOptions = computed(() => {
  if (!ticket.value) return [];
  const current = ticket.value.status;
  return (Object.keys(STATUS_LABELS) as TicketStatus[])
    .filter((status) => status === current || canTransitionTo(current, status))
    .map((status) => ({ value: status, title: STATUS_LABELS[status] }));
});

async function load() {
  loading.value = true;
  notFoundOrForbidden.value = false;
  try {
    ticket.value = await api.tickets.get(props.id);
  } catch {
    notFoundOrForbidden.value = true;
  } finally {
    loading.value = false;
  }
}

async function sendReply() {
  if (!replyBody.value.trim()) return;
  sending.value = true;
  try {
    await api.tickets.addMessage(props.id, {
      body: replyBody.value,
      is_internal_note: isInternalNote.value,
    });
    replyBody.value = "";
    isInternalNote.value = false;
    await load();
  } finally {
    sending.value = false;
  }
}

async function changeStatus(status: TicketStatus) {
  updating.value = true;
  try {
    await api.tickets.update(props.id, { status });
    await load();
  } finally {
    updating.value = false;
  }
}

async function changePriority(priority: TicketDetail["priority"]) {
  updating.value = true;
  try {
    await api.tickets.update(props.id, { priority });
    await load();
  } finally {
    updating.value = false;
  }
}

async function assignToMe() {
  if (!auth.user) return;
  updating.value = true;
  try {
    await api.tickets.update(props.id, { assigned_to: auth.user.id });
    await load();
  } finally {
    updating.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate />

    <v-alert v-else-if="notFoundOrForbidden" type="error" variant="tonal">
      Chamado não encontrado ou você não tem acesso a ele.
    </v-alert>

    <template v-else-if="ticket">
      <div class="d-flex flex-wrap align-center justify-space-between mb-4 ga-2">
        <div>
          <h1 class="text-h6">{{ ticket.subject }}</h1>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ ticket.offer_name }} · {{ CYCLE_PHASE_LABELS[ticket.cycle_phase_at_opening] }}
          </p>
        </div>
        <TicketStatusChip :status="ticket.status" />
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <v-card class="cac-surface pa-4 mb-4" flat>
            <p class="text-body-2">{{ ticket.description }}</p>
            <div class="d-flex ga-2 flex-wrap mt-2">
              <v-chip size="small" variant="outlined">{{ CATEGORY_LABELS[ticket.category] }}</v-chip>
              <v-chip size="small" variant="outlined">{{ PRIORITY_LABELS[ticket.priority] }}</v-chip>
            </div>
          </v-card>

          <h2 class="text-subtitle-1 mb-2">Conversa</h2>
          <v-list class="cac-surface mb-4" aria-label="Mensagens do chamado">
            <v-list-item v-for="message in ticket.messages" :key="message.id">
              <template #prepend>
                <v-avatar size="32" :color="message.is_internal_note ? 'warning' : 'primary'">
                  <span class="text-caption">{{ message.author.first_name.charAt(0) }}</span>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ message.author.first_name }} {{ message.author.last_name }}
                <v-chip v-if="message.is_internal_note" size="x-small" color="warning" class="ml-2">
                  Nota interna
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="text-wrap">{{ message.body }}</v-list-item-subtitle>
              <template #append>
                <span class="text-caption text-medium-emphasis">
                  {{ formatDateTime(message.created_at) }}
                </span>
              </template>
            </v-list-item>
            <v-list-item v-if="ticket.messages.length === 0">
              <v-list-item-title class="text-medium-emphasis">
                Nenhuma mensagem ainda.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <v-card class="cac-surface pa-4" flat>
            <v-textarea v-model="replyBody" label="Escrever resposta" rows="3" class="mb-2" />
            <v-checkbox
              v-if="auth.isAgent"
              v-model="isInternalNote"
              label="Nota interna (não visível para o aluno)"
              density="compact"
            />
            <v-btn color="primary" :loading="sending" @click="sendReply">Enviar</v-btn>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card v-if="auth.isAgent" class="cac-surface pa-4" flat>
            <h2 class="text-subtitle-1 mb-3">Gerenciar chamado</h2>

            <v-select
              :model-value="ticket.status"
              :items="statusOptions"
              label="Status"
              :disabled="updating"
              class="mb-2"
              @update:model-value="changeStatus"
            />

            <v-select
              :model-value="ticket.priority"
              :items="Object.entries(PRIORITY_LABELS).map(([value, title]) => ({ value, title }))"
              label="Prioridade"
              :disabled="updating"
              class="mb-4"
              @update:model-value="changePriority"
            />

            <div class="mb-2">
              <span class="text-caption text-medium-emphasis">Atribuído a:</span>
              <p class="mb-2">
                {{ ticket.assigned_to ? `${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}` : "Ninguém" }}
              </p>
              <v-btn
                v-if="!ticket.assigned_to || ticket.assigned_to.id !== auth.user?.id"
                size="small"
                variant="tonal"
                :loading="updating"
                @click="assignToMe"
              >
                Atribuir a mim
              </v-btn>
            </div>
          </v-card>

          <v-card class="cac-surface pa-4 mt-4" flat>
            <h2 class="text-subtitle-1 mb-2">Linha do tempo</h2>
            <p class="text-caption mb-1">Aberto: {{ formatDateTime(ticket.created_at) }}</p>
            <p class="text-caption mb-1">
              1ª resposta: {{ formatDateTime(ticket.first_response_at) }}
            </p>
            <p class="text-caption mb-1">Resolvido: {{ formatDateTime(ticket.resolved_at) }}</p>
            <p class="text-caption mb-0">Fechado: {{ formatDateTime(ticket.closed_at) }}</p>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
