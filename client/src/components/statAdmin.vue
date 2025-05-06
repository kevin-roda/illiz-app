<template>
  <v-container class="pa-4" fluid>
    <v-row>
      <!-- CARTES STATISTIQUES -->
      <v-col cols="12">
        <v-row>
          <v-col v-for="(stat, i) in stats" :key="i" cols="12" sm="6" md="4">
            <v-card class="stat-card d-flex align-center pa-3" elevation="2">
              <v-avatar size="40" :color="stat.color || 'primary'" class="me-3">
                <component
                  :is="PhBuildings"
                  :size="26"
                  color="#ffffff"
                  weight="light"
                  style="fill: #4c6c5a"
                />
              </v-avatar>
              <div>
                <div class="text-h6">{{ stat.valeur }}</div>
                <div class="text-h6 text-grey-darken-1">
                  {{ stat.label }}
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- BAR CHART (Participation) -->
      <v-col cols="12" md="12">
        <v-card
          class="pa-4 mb-4 stats"
          v-if="Array.isArray(props.stats.dataBar.datasets)"
        >
          <h4 class="text-subtitle-1 font-weight-medium mb-2">
            Cumul des offres / mois
          </h4>
          <Bar :data="props.stats.dataBar" :options="barOptions" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

import { PhBuildings } from "@phosphor-icons/vue";

// Variables
const data = ref(null);
const stats = ref([]);

const barData = ref({});
const barOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      ticks: {
        stepSize: 1,
      },
    },
  },
});
const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
});
console.log(props.stats);

const iconMap = {};
stats.value = props.stats.stat;
</script>

<style scoped>
.stat-card {
  border-radius: 14px;
  background-color: #fff;
  min-height: 90px;
  transition: all 0.3s ease;
}

.stats {
  height: 300px;
  padding-bottom: 50px !important;
}
</style>
