<template>
  <v-container class="pa-4" fluid>
    <v-row>
      <!-- CARTES STATISTIQUES -->
      <v-col cols="12">
        <v-row>
          <v-col v-for="(stat, i) in stats" :key="i" cols="12" sm="6" md="3">
            <v-card class="stat-card d-flex align-center pa-3" elevation="2">
              <v-avatar size="40" :color="stat.color || 'primary'" class="me-3">
                <component
                  :is="stat.icon"
                  :size="26"
                  color="#ffffff"
                  weight="bold"
                />
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">{{ stat.valeur }}</div>
                <div class="text-caption text-grey-darken-1">
                  {{ stat.label }}
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- BAR CHART (Participation) -->
      <v-col cols="12" md="12">
        <v-card class="pa-4 mb-4 stats" v-if="Array.isArray(barData.datasets)">
          <h4 class="text-subtitle-1 font-weight-medium mb-2">
            Participation par utilisateur
          </h4>
          <Bar :data="barData" :options="barOptions" />
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

import {
  PhUsers,
  PhFileText,
  PhCurrencyEur,
  PhTrendUp,
  PhClock,
  PhTimer,
} from "@phosphor-icons/vue";

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

const iconMap = {
  participants: PhUsers,
  offres: PhFileText,
  derniereOffre: PhCurrencyEur,
  evolutionDepuisPremier: PhTrendUp,
  evolutionDepuisMinimum: PhTrendUp,
  tempsMoyen: PhClock,
  offresDerniereMinute: PhTimer,
};

// Chargement de la data
onMounted(() => {
  const element = document.getElementById("statistiques-vente");
  if (!element) {
    console.error("Pas de #statistiques-vente trouvé");
    return;
  }

  const rawData = element.dataset.statistiques;
  if (!rawData) {
    console.error("Pas de data-statistiques trouvé");
    return;
  }

  const rawBar = element.dataset.bar;
  if (!rawBar) {
    console.error("Pas de data-bar trouvé");
    return;
  }

  try {
    data.value = JSON.parse(rawData);
    barData.value = JSON.parse(rawBar);
  } catch (e) {
    console.error("Erreur parsing JSON :", e);
  }
});

// Dès que la data est dispo
watch(data, (newData) => {
  if (!newData) return;

  // Remplir les stats
  stats.value = [
    {
      icon: iconMap.participants,
      valeur: newData.nombre_participants ?? 0,
      label: "Participants",
      color: "purple lighten-1",
    },
    {
      icon: iconMap.offres,
      valeur: newData.nombre_offres ?? 0,
      label: "Offres reçues",
      color: "green lighten-1",
    },
    {
      icon: iconMap.derniereOffre,
      valeur: formatPrix(newData.derniere_offre ?? 0),
      label: "Dernière offre reçue",
      color: "red lighten-1",
    },
    {
      icon: iconMap.evolutionDepuisPremier,
      valeur: `${newData.evolution_depuis_premiere_offre ?? 0}%`,
      label: `Par rapport à la 1ère offre (${formatPrix(
        newData.premiere_offre ?? 0
      )})`,
      color: "light-green lighten-1",
    },
    {
      icon: iconMap.evolutionDepuisMinimum,
      valeur: `${newData.evolution_depuis_prix_minimum ?? 0}%`,
      label: `Par rapport au prix min souhaité (${formatPrix(
        newData.prix_minimum ?? 0
      )})`,
      color: "cyan lighten-1",
    },
    {
      icon: iconMap.tempsMoyen,
      valeur: `${newData.temps_moyen_entre_offres_sec ?? 0}s`,
      label: "Temps moyen entre offres",
      color: "blue-grey lighten-1",
    },
  ];

  // Préparer Bar Chart uniquement sur la data existante
});

function formatPrix(p) {
  return Number(p).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}
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
