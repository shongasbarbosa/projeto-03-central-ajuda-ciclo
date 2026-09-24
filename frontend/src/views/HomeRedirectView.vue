<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

onMounted(() => {
  if (auth.isAgent) {
    router.replace({ name: "agent-queue" });
  } else {
    router.replace({ name: "student-tickets" });
  }
});
</script>

<template>
  <div />
</template>
