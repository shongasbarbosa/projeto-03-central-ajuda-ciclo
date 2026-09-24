<script setup lang="ts">
import * as echarts from "echarts";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{ option: echarts.EChartsOption; summary: string }>();

const el = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function render() {
  if (!chart) return;
  chart.setOption(props.option, true);
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  render();
  window.addEventListener("resize", handleResize);
});

function handleResize() {
  chart?.resize();
}

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  chart?.dispose();
});
</script>

<template>
  <div>
    <div ref="el" class="echart" role="img" :aria-label="summary" />
    <p class="text-caption text-medium-emphasis mt-1">{{ summary }}</p>
  </div>
</template>

<style scoped>
.echart {
  width: 100%;
  height: 320px;
}
</style>
