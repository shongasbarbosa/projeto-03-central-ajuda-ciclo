<script setup lang="ts">
import { isDemoMode } from "@/services";
</script>

<template>
  <div v-if="isDemoMode" class="cac-demo-banner bg-warning text-on-warning" role="status">
    Modo demonstração: dados fictícios, sem backend.
  </div>
</template>
