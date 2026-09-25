<script setup lang="ts">
import type { EChartsOption } from "echarts";
import { computed, onMounted, ref } from "vue";

import EChart from "@/components/EChart.vue";
import { useAppTheme } from "@/composables/useTheme";
import { api } from "@/services";
import type { ReportCategoryRow, ReportPhaseRow, ReportSummary } from "@/services/types";
import {
  CATEGORY_LABELS,
  CYCLE_PHASE_LABELS,
  STATUS_LABELS,
  formatHours,
  formatNumber,
  formatOneDecimal,
} from "@/utils/labels";

const { isDark } = useAppTheme();

const phaseData = ref<ReportPhaseRow[]>([]);
const categoryData = ref<ReportCategoryRow[]>([]);
const summary = ref<ReportSummary | null>(null);
const loading = ref(true);

const textColor = computed(() => (isDark.value ? "#E7E9F0" : "#1A1C22"));
const paletteBySeries = ["#1E4FD8", "#4A5CC5", "#2AA876", "#946200", "#C4281C", "#7C9BFF"];

function formatAxisNumber(value: number): string {
  return formatNumber(value);
}

const phaseChartOption = computed<EChartsOption>(() => ({
  animation: false,
  backgroundColor: "transparent",
  textStyle: { color: textColor.value },
  color: paletteBySeries,
  tooltip: {
    trigger: "axis",
    valueFormatter: (value) => formatNumber(Number(value)),
  },
  grid: { left: 48, right: 16, top: 24, bottom: 32 },
  xAxis: {
    type: "category",
    data: phaseData.value.map((row) => CYCLE_PHASE_LABELS[row.cycle_phase]),
    axisLabel: { color: textColor.value },
    axisLine: { lineStyle: { color: textColor.value } },
  },
  yAxis: {
    type: "value",
    axisLabel: { color: textColor.value, formatter: formatAxisNumber },
    splitLine: { lineStyle: { color: isDark.value ? "#2A2E38" : "#E3E5EC" } },
  },
  series: [
    {
      name: "Chamados",
      type: "bar",
      data: phaseData.value.map((row) => row.total),
      label: {
        show: true,
        position: "top",
        color: textColor.value,
        formatter: (params) => formatNumber(Number(params.value)),
      },
    },
  ],
}));

const categoryChartOption = computed<EChartsOption>(() => ({
  animation: false,
  backgroundColor: "transparent",
  textStyle: { color: textColor.value },
  color: paletteBySeries,
  tooltip: {
    trigger: "axis",
    valueFormatter: (value) => `${formatOneDecimal(Number(value))} h`,
  },
  grid: { left: 48, right: 16, top: 24, bottom: 64 },
  xAxis: {
    type: "category",
    data: categoryData.value.map((row) => CATEGORY_LABELS[row.category]),
    axisLabel: { color: textColor.value, rotate: 20 },
    axisLine: { lineStyle: { color: textColor.value } },
  },
  yAxis: {
    type: "value",
    name: "horas",
    axisLabel: { color: textColor.value, formatter: formatAxisNumber },
    splitLine: { lineStyle: { color: isDark.value ? "#2A2E38" : "#E3E5EC" } },
  },
  series: [
    {
      name: "Tempo médio de resolução (h)",
      type: "bar",
      data: categoryData.value.map((row) => row.avg_resolution_hours ?? 0),
      label: {
        show: true,
        position: "top",
        color: textColor.value,
        formatter: (params) => formatOneDecimal(Number(params.value)),
      },
    },
  ],
}));

const statusChartOption = computed<EChartsOption>(() => ({
  animation: false,
  backgroundColor: "transparent",
  textStyle: { color: textColor.value },
  color: paletteBySeries,
  tooltip: {
    trigger: "item",
    valueFormatter: (value) => formatNumber(Number(value)),
  },
  legend: { bottom: 0, textStyle: { color: textColor.value } },
  series: [
    {
      type: "pie",
      radius: ["45%", "70%"],
      label: {
        color: textColor.value,
        formatter: (params) => formatNumber(Number(params.value)),
      },
      data: Object.entries(summary.value?.by_status ?? {}).map(([status, total]) => ({
        name: STATUS_LABELS[status] ?? status,
        value: total,
      })),
    },
  ],
}));

const phaseSummaryText = computed(() =>
  phaseData.value
    .map(
      (row) =>
        `${CYCLE_PHASE_LABELS[row.cycle_phase]}: ${formatNumber(row.total)} chamados, tempo médio de resolução ${formatHours(row.avg_resolution_hours)}`
    )
    .join(". ")
);

const categorySummaryText = computed(() =>
  categoryData.value
    .map(
      (row) =>
        `${CATEGORY_LABELS[row.category]}: ${formatNumber(row.total)} chamados, tempo médio de resolução ${formatHours(row.avg_resolution_hours)}`
    )
    .join(". ")
);

const statusRows = computed(() => {
  if (!summary.value) return [];
  return Object.entries(summary.value.by_status).map(([status, total]) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    total,
  }));
});

const statusSummaryText = computed(() =>
  statusRows.value.map((row) => `${row.label}: ${formatNumber(row.total)}`).join(". ")
);

onMounted(async () => {
  loading.value = true;
  try {
    const [phases, categories, summaryData] = await Promise.all([
      api.reports.ticketsByCyclePhase(),
      api.reports.avgResolutionTime(),
      api.reports.summary(),
    ]);
    phaseData.value = phases;
    categoryData.value = categories;
    summary.value = summaryData;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1 class="text-h6 mb-4">Relatórios</h1>

    <v-progress-linear v-if="loading" indeterminate />

    <template v-else>
      <v-row class="mb-2">
        <v-col cols="12" sm="4">
          <v-card class="cac-surface pa-4 text-center" flat>
            <p class="text-body-2 font-weight-500 text-medium-emphasis mb-1">Total de chamados</p>
            <p class="text-h4 mb-0">{{ formatNumber(summary?.total_tickets ?? 0) }}</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="cac-surface pa-4 text-center" flat>
            <p class="text-body-2 font-weight-500 text-medium-emphasis mb-1">
              Tempo médio de 1ª resposta
            </p>
            <p class="text-h4 mb-0">{{ formatHours(summary?.avg_first_response_hours ?? null) }}</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card class="cac-surface pa-4 text-center" flat>
            <p class="text-body-2 font-weight-500 text-medium-emphasis mb-1">
              Tempo médio de resolução
            </p>
            <p class="text-h4 mb-0">{{ formatHours(summary?.avg_resolution_hours ?? null) }}</p>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card class="cac-surface pa-4" flat>
            <h2 class="text-subtitle-1 mb-2">Volume por fase do ciclo</h2>
            <EChart :option="phaseChartOption" :summary="phaseSummaryText" />
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="cac-surface pa-4" flat>
            <h2 class="text-subtitle-1 mb-2">Tempo médio de resolução por categoria</h2>
            <EChart :option="categoryChartOption" :summary="categorySummaryText" />
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="cac-surface pa-4" flat>
            <h2 class="text-subtitle-1 mb-2">Resumo por status</h2>
            <EChart :option="statusChartOption" :summary="statusSummaryText" />
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="cac-surface pa-4" flat>
            <h2 class="text-subtitle-1 mb-2">Chamados por status</h2>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Status</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statusRows" :key="row.status">
                  <td>{{ row.label }}</td>
                  <td class="text-right">{{ formatNumber(row.total) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
