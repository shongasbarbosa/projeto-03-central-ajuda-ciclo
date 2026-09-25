<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import FaqSuggestions from "@/components/FaqSuggestions.vue";
import { api } from "@/services";
import type { Offer, TicketCategory, TicketPriority } from "@/services/types";
import { CATEGORY_LABELS, CYCLE_PHASE_LABELS, PRIORITY_LABELS } from "@/utils/labels";
import { isStepClickable } from "@/utils/stepper";

const router = useRouter();

const steps = [
  { value: 1, title: "Oferta" },
  { value: 2, title: "Descrição" },
  { value: 3, title: "Revisão" },
];

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
const canSubmit = computed(
  () => subject.value.trim().length > 0 && description.value.trim().length > 0
);

function goToStep(value: number) {
  if (isStepClickable(step.value, value)) {
    step.value = value;
  }
}

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
    router.push({
      name: "ticket-detail",
      params: { id: ticket.id },
      query: { created: "1" },
    });
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

    <div class="cac-surface">
      <div class="cac-stepper-header" role="tablist" aria-label="Etapas do formulário">
        <template v-for="(s, idx) in steps" :key="s.value">
          <component
            :is="isStepClickable(step, s.value) ? 'button' : 'div'"
            type="button"
            class="cac-stepper-item"
            :class="{
              'cac-stepper-item--clickable': isStepClickable(step, s.value),
              'cac-stepper-item--current': step === s.value,
              'cac-stepper-item--done': s.value < step,
            }"
            :aria-current="step === s.value ? 'step' : undefined"
            :aria-disabled="!isStepClickable(step, s.value) ? 'true' : undefined"
            :aria-label="isStepClickable(step, s.value) ? `Voltar para a etapa ${s.title}` : undefined"
            :tabindex="isStepClickable(step, s.value) ? 0 : -1"
            @click="goToStep(s.value)"
          >
            <span class="cac-stepper-index">{{ s.value }}</span>
            <span class="cac-stepper-title">{{ s.title }}</span>
          </component>
          <div v-if="idx < steps.length - 1" class="cac-stepper-divider" aria-hidden="true" />
        </template>
      </div>

      <div class="pa-4">
        <div v-if="step === 1">
          <v-select
            v-model="offerId"
            :items="offers"
            item-title="name"
            item-value="id"
            label="Selecione a oferta"
            class="mb-2"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
                :subtitle="CYCLE_PHASE_LABELS[item.raw.cycle_phase]"
              />
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
        </div>

        <div v-else-if="step === 2">
          <v-text-field v-model="subject" label="Assunto" class="mb-2" />
          <v-textarea v-model="description" label="Descreva o problema" rows="4" class="mb-2" />
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
        </div>

        <div v-else-if="step === 3">
          <dl class="cac-review-list mb-4">
            <div class="cac-review-row">
              <dt>Oferta</dt>
              <dd>{{ selectedOffer?.name }}</dd>
            </div>
            <div class="cac-review-row">
              <dt>Fase do ciclo</dt>
              <dd>{{ selectedOffer ? CYCLE_PHASE_LABELS[selectedOffer.cycle_phase] : "" }}</dd>
            </div>
            <div class="cac-review-row">
              <dt>Categoria</dt>
              <dd>{{ category ? CATEGORY_LABELS[category] : "" }}</dd>
            </div>
            <div class="cac-review-row">
              <dt>Prioridade</dt>
              <dd>{{ PRIORITY_LABELS[priority] }}</dd>
            </div>
            <div class="cac-review-row">
              <dt>Assunto</dt>
              <dd>{{ subject }}</dd>
            </div>
            <div class="cac-review-row">
              <dt>Descrição</dt>
              <dd class="cac-review-description">{{ description }}</dd>
            </div>
          </dl>

          <v-alert v-if="errorMessage" type="error" density="compact" class="mb-4">
            {{ errorMessage }}
          </v-alert>

          <div class="d-flex ga-2">
            <v-btn variant="text" @click="step = 2">Voltar</v-btn>
            <v-btn color="primary" :loading="submitting" @click="submit">Enviar chamado</v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cac-stepper-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--cac-surface-border, rgba(0, 0, 0, 0.08));
}

.cac-stepper-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 4px 8px;
  border-radius: var(--cac-radius-sm);
  font: inherit;
  color: rgba(var(--v-theme-on-surface), 0.5);
  cursor: default;
}

.cac-stepper-item--done {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.cac-stepper-item--current {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}

.cac-stepper-item--clickable {
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
}

.cac-stepper-item--clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.cac-stepper-item--clickable:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.cac-stepper-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-on-surface), 0.12);
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.75rem;
}

.cac-stepper-item--current .cac-stepper-index {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.cac-stepper-divider {
  flex: 1;
  height: 1px;
  background-color: rgba(var(--v-theme-on-surface), 0.12);
  margin: 0 8px;
}

.cac-review-list {
  margin: 0;
}

.cac-review-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.cac-review-row dt {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.cac-review-row dd {
  margin: 0;
}

.cac-review-description {
  white-space: pre-line;
}

@media (max-width: 599.98px) {
  .cac-review-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
