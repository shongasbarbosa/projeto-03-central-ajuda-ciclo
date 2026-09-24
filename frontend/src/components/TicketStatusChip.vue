<script setup lang="ts">
import { STATUS_COLORS, STATUS_LABELS } from "@/utils/labels";

defineProps<{ status: string }>();
</script>

<template>
  <v-chip :color="STATUS_COLORS[status]" size="small" variant="flat">
    {{ STATUS_LABELS[status] ?? status }}
  </v-chip>
</template>
