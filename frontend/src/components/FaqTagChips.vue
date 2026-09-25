<script setup lang="ts">
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CYCLE_PHASE_COLORS,
  CYCLE_PHASE_ICONS,
  CYCLE_PHASE_LABELS,
} from "@/utils/labels";

defineProps<{ category: string; cyclePhase: string }>();
</script>

<template>
  <div class="d-flex ga-2 flex-wrap">
    <v-chip
      size="small"
      variant="flat"
      :color="CATEGORY_COLORS[category]"
      :prepend-icon="CATEGORY_ICONS[category]"
    >
      Categoria: {{ CATEGORY_LABELS[category] ?? category }}
    </v-chip>
    <v-chip
      size="small"
      variant="flat"
      :color="CYCLE_PHASE_COLORS[cyclePhase]"
      :prepend-icon="CYCLE_PHASE_ICONS[cyclePhase]"
    >
      Fase: {{ CYCLE_PHASE_LABELS[cyclePhase] ?? cyclePhase }}
    </v-chip>
  </div>
</template>
