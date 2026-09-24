<script setup lang="ts">
import { onMounted, ref } from "vue";

import { api } from "@/services";
import type { FaqArticle, TicketCategory } from "@/services/types";
import { CATEGORY_LABELS, CYCLE_PHASE_LABELS } from "@/utils/labels";

const articles = ref<FaqArticle[]>([]);
const loading = ref(true);
const dialogOpen = ref(false);
const saving = ref(false);
const editing = ref<FaqArticle | null>(null);

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

async function remove(article: FaqArticle) {
  await api.faq.remove(article.id);
  await load();
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
      <v-list-item v-for="article in articles" :key="article.id">
        <v-list-item-title>{{ article.question }}</v-list-item-title>
        <v-list-item-subtitle>
          {{ CATEGORY_LABELS[article.category] }} · {{ CYCLE_PHASE_LABELS[article.cycle_phase] }}
          · 👍 {{ article.helpful_count }} · 👎 {{ article.not_helpful_count }}
          <span v-if="!article.is_published"> · (não publicado)</span>
        </v-list-item-subtitle>
        <template #append>
          <v-btn icon="mdi-pencil" variant="text" aria-label="Editar" @click="openEdit(article)" />
          <v-btn icon="mdi-delete" variant="text" aria-label="Excluir" @click="remove(article)" />
        </template>
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
  </div>
</template>
