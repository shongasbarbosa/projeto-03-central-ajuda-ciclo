<script setup lang="ts">
import { onMounted, ref } from "vue";

import FaqTagChips from "@/components/FaqTagChips.vue";
import { api } from "@/services";
import type { FaqArticle, TicketCategory } from "@/services/types";
import { CATEGORY_LABELS, CYCLE_PHASE_LABELS, formatNumber } from "@/utils/labels";

const articles = ref<FaqArticle[]>([]);
const loading = ref(true);
const dialogOpen = ref(false);
const saving = ref(false);
const editing = ref<FaqArticle | null>(null);

const deleteDialogOpen = ref(false);
const deleting = ref(false);
const articleToDelete = ref<FaqArticle | null>(null);

const snackbar = ref(false);
const snackbarText = ref("");

const form = ref({
  question: "",
  answer: "",
  category: "acesso" as TicketCategory,
  cycle_phase: "matricula" as FaqArticle["cycle_phase"],
  is_published: true,
});

const categoryItems = Object.entries(CATEGORY_LABELS).map(([value, title]) => ({ value, title }));
const phaseItems = Object.entries(CYCLE_PHASE_LABELS).map(([value, title]) => ({ value, title }));

async function load() {
  loading.value = true;
  try {
    articles.value = await api.faq.list();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.value = {
    question: "",
    answer: "",
    category: "acesso",
    cycle_phase: "matricula",
    is_published: true,
  };
  dialogOpen.value = true;
}

function openEdit(article: FaqArticle) {
  editing.value = article;
  form.value = {
    question: article.question,
    answer: article.answer,
    category: article.category,
    cycle_phase: article.cycle_phase,
    is_published: article.is_published,
  };
  dialogOpen.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editing.value) {
      await api.faq.update(editing.value.id, form.value);
    } else {
      await api.faq.create({ ...form.value });
    }
    dialogOpen.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

function confirmDelete(article: FaqArticle) {
  articleToDelete.value = article;
  deleteDialogOpen.value = true;
}

async function remove() {
  if (!articleToDelete.value) return;
  deleting.value = true;
  try {
    const question = articleToDelete.value.question;
    await api.faq.remove(articleToDelete.value.id);
    deleteDialogOpen.value = false;
    articleToDelete.value = null;
    await load();
    snackbarText.value = `Artigo "${question}" excluído com sucesso.`;
    snackbar.value = true;
  } finally {
    deleting.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <h1 class="text-h6">Gerenciar FAQ</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Novo artigo</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate />

    <v-list v-else class="cac-surface">
      <v-list-item v-for="article in articles" :key="article.id" class="py-3">
        <div class="d-flex justify-space-between align-start ga-2 flex-wrap">
          <div>
            <p class="text-body-1 font-weight-500 mb-2">{{ article.question }}</p>
            <FaqTagChips
              class="mb-2"
              :category="article.category"
              :cycle-phase="article.cycle_phase"
            />
            <div class="d-flex align-center ga-3 text-body-2 text-medium-emphasis">
              <span class="d-flex align-center ga-1">
                <v-icon icon="mdi-thumb-up-outline" size="16" aria-hidden="true" />
                <span :aria-label="`${article.helpful_count} avaliações úteis`">
                  {{ formatNumber(article.helpful_count) }}
                </span>
              </span>
              <span class="d-flex align-center ga-1">
                <v-icon icon="mdi-thumb-down-outline" size="16" aria-hidden="true" />
                <span :aria-label="`${article.not_helpful_count} avaliações não úteis`">
                  {{ formatNumber(article.not_helpful_count) }}
                </span>
              </span>
              <span v-if="!article.is_published">(não publicado)</span>
            </div>
          </div>
          <div class="d-flex">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              aria-label="Editar"
              @click="openEdit(article)"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              aria-label="Excluir"
              @click="confirmDelete(article)"
            />
          </div>
        </div>
      </v-list-item>
    </v-list>

    <v-dialog v-model="dialogOpen" max-width="560">
      <v-card class="cac-surface pa-4">
        <v-card-title>{{ editing ? "Editar artigo" : "Novo artigo" }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.question" label="Pergunta" class="mb-2" />
          <v-textarea v-model="form.answer" label="Resposta" rows="4" class="mb-2" />
          <v-select
            v-model="form.category"
            :items="categoryItems"
            label="Categoria"
            class="mb-2"
          />
          <v-select
            v-model="form.cycle_phase"
            :items="phaseItems"
            label="Fase do ciclo"
            class="mb-2"
          />
          <v-checkbox v-model="form.is_published" label="Publicado" density="compact" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialogOpen" max-width="480" role="alertdialog">
      <v-card class="cac-surface pa-4">
        <v-card-title>Excluir artigo</v-card-title>
        <v-card-text>
          Excluir o artigo "{{ articleToDelete?.question }}"? Esta ação não pode ser desfeita.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="remove">Excluir</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" timeout="4000">{{ snackbarText }}</v-snackbar>
  </div>
</template>
