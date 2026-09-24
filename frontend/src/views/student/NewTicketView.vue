<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import FaqSuggestions from "@/components/FaqSuggestions.vue";
import { api } from "@/services";
import type { Offer, TicketCategory, TicketPriority } from "@/services/types";
import { CATEGORY_LABELS, CYCLE_PHASE_LABELS, PRIORITY_LABELS } from "@/utils/labels";

const router = useRouter();

const step = ref(1);
const offers = ref<Offer[]>([]);
const submitting = ref(false);
const errorMessage = ref("");

const offerId = ref<number | null>(null);
const category = ref<TicketCategory | null>(null);
const priority = ref<TicketPriority>("media");
const subject = ref("");
const description = ref("");

const categories = Object.entries(CATEGORY_LABELS) as [TicketCategory, string][];
const priorities = Object.entries(PRIORITY_LABELS) as [TicketPriority, string][];

const selectedOffer = computed(() => offers.value.find((o) => o.id === offerId.value) ?? null);
const canGoToStep2 = computed(() => offerId.value !== null && category.value !== null);
const canSubmit = computed(() => subject.value.trim().length > 0 && description.value.trim().length > 0);

onMounted(async () => {
  offers.value = await api.offers.list();
});

async function submit() {
  if (!offerId.value || !category.value) return;
  submitting.value = true;
  errorMessage.value = "";
  try {
    const ticket = await api.tickets.create({
      offer: offerId.value,
      category: category.value,
      priority: priority.value,
      subject: subject.value,
      description: description.value,
    });
    router.push({ name: "ticket-detail", params: { id: ticket.id } });
  } catch {
    errorMessage.value = "Não foi possível abrir o chamado. Tente novamente.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-h6 mb-4">Abrir novo chamado</h1>

    <v-stepper v-model="step" :items="['Oferta', 'Descrição', 'Revisão']" hide-actions>
      <template #item.1>
        <v-card class="cac-surface pa-4" flat>
          <v-select
            v-model="offerId"
            :items="offers"
            item-title="name"
            item-value="id"
            label="Selecione a oferta"
            class="mb-2"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :subtitle="CYCLE_PHASE_LABELS[item.raw.cycle_phase]" />
            </template>
          </v-select>

          <v-select
            v-model="category"
            :items="categories"
            item-title="1"
            item-value="0"
            label="Categoria do problema"
            class="mb-4"
          />

          <v-btn color="primary" :disabled="!canGoToStep2" @click="step = 2">Continuar</v-btn>
        </v-card>
      </template>

      <template #item.2>
        <v-card class="cac-surface pa-4" flat>
          <v-text-field v-model="subject" label="Assunto" class="mb-2" />
          <v-textarea
            v-model="description"
            label="Descreva o problema"
            rows="4"
            class="mb-2"
          />
          <v-select
            v-model="priority"
            :items="priorities"
            item-title="1"
            item-value="0"
            label="Prioridade"
            class="mb-4"
          />

          <FaqSuggestions :query="`${subject} ${description}`" :offer-id="offerId ?? undefined" />

          <div class="d-flex ga-2 mt-4">
            <v-btn variant="text" @click="step = 1">Voltar</v-btn>
            <v-btn color="primary" :disabled="!canSubmit" @click="step = 3">Continuar</v-btn>
          </div>
        </v-card>
      </template>

      <template #item.3>
        <v-card class="cac-surface pa-4" flat>
          <p class="text-body-2 mb-1"><strong>Oferta:</strong> {{ selectedOffer?.name }}</p>
          <p class="text-body-2 mb-1">
            <strong>Categoria:</strong> {{ category ? CATEGORY_LABELS[category] : "" }}
          </p>
          <p class="text-body-2 mb-1"><strong>Assunto:</strong> {{ subject }}</p>
          <p class="text-body-2 mb-4">{{ description }}</p>

          <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex ga-2">
            <v-btn variant="text" @click="step = 2">Voltar</v-btn>
            <v-btn color="primary" :loading="submitting" @click="submit">Enviar chamado</v-btn>
          </div>
        </v-card>
      </template>
    </v-stepper>
  </div>
</template>
