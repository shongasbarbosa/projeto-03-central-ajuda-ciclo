<script setup lang="ts">
import { onMounted } from "vue";

import { useAppTheme, type ThemeMode } from "@/composables/useTheme";

const { mode, initTheme } = useAppTheme();

onMounted(initTheme);

const options: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: "system", label: "Sistema", icon: "mdi-theme-light-dark" },
  { value: "light", label: "Claro", icon: "mdi-white-balance-sunny" },
  { value: "dark", label: "Escuro", icon: "mdi-weather-night" },
];
</script>

<template>
  <div class="d-flex" role="group" aria-label="Selecionar tema da interface">
    <v-tooltip v-for="option in options" :key="option.value" :text="option.label" location="bottom">
      <template #activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          :icon="option.icon"
          variant="text"
          size="small"
          :aria-label="`Tema ${option.label}`"
          :aria-pressed="mode === option.value"
          :color="mode === option.value ? 'primary' : undefined"
          @click="mode = option.value"
        />
      </template>
    </v-tooltip>
  </div>
</template>
