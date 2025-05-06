<template>
  <div class="container">
    <v-container fluid class="pa-0 d-flex flex-column">
      <!-- Première Card -->
      <v-card class="pa-4" rounded="xl" elevation="0">
        <v-card-title class="mb-4 text-left"
          >Informations générales</v-card-title
        >
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6" lg="3">
              <v-text-field
                label="Type"
                v-model="editableBien.type"
                variant="outlined"
                rounded="xl"
                disabled
              />
            </v-col>
            <v-col cols="12" md="6" lg="3">
              <v-text-field
                label="Commune"
                v-model="editableBien.commune"
                variant="outlined"
                rounded="xl"
                disabled
              />
            </v-col>
            <v-col cols="12" md="6" lg="3">
              <v-text-field
                label="Référence dossier"
                v-model="editableBien.referenceDossier"
                variant="outlined"
                rounded="xl"
                disabled
              />
            </v-col>
            <v-col cols="12" md="6" lg="3">
              <v-text-field
                label="Prix minimum"
                v-model="editableBien.prixMinimum"
                type="number"
                variant="outlined"
                rounded="xl"
                prefix="€"
                disabled
              />
            </v-col>
          </v-row>

          <!-- Section Visites -->
          <!-- Section Visites -->
          <v-row dense>
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-medium mb-2 text-left">
                Visites
              </div>
              <v-row dense>
                <v-col
                  cols="12"
                  md="6"
                  v-for="(visite, index) in editableBien.visites"
                  :key="index"
                >
                  <v-text-field
                    :label="'Visites'"
                    :model-value="formatVisite(visite)"
                    variant="outlined"
                    rounded="xl"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Deuxième Card : Résumé des statistiques -->
      <v-card class="pa-4 mt-4" rounded="xl" elevation="0">
        <v-card-title class="mb-4 text-left">Résumé</v-card-title>

        <v-row dense>
          <!-- Statistique 1 : Acquéreurs -->
          <v-col cols="12" md="6" lg="3" class="d-flex justify-center">
            <div class="stat-icon">
              <PhUsers :size="31" color="#90b7aa" weight="light" />
            </div>
            <div class="stat-text ml-1">
              <div class="stat-title">Acquéreurs</div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">{{ getTotalAcquereurs() }}</div>
                <div class="mr-2">Potentiel</div>
              </div>
            </div>
          </v-col>

          <!-- Statistique 2 : Visites -->
          <v-col
            cols="12"
            md="6"
            lg="3"
            class="d-flex text-left justify-center"
          >
            <div class="stat-icon">
              <PhHouse :size="31" color="#90b7aa" weight="light" />
            </div>
            <div class="stat-text ml-1">
              <div class="stat-title">Visites</div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">
                  {{ getAcquereursWithVisite(true) }}
                </div>
                <div>Effectuée</div>
              </div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">
                  {{ getAcquereursWithVisite(false) }}
                </div>
                <div class="mr-2">Non effectuée</div>
              </div>
            </div>
          </v-col>

          <!-- Statistique 3 : Dossiers -->
          <v-col
            cols="12"
            md="6"
            lg="3"
            class="d-flex text-left justify-center"
          >
            <div class="stat-icon">
              <PhFolder :size="31" color="#90b7aa" weight="light" />
            </div>
            <div class="stat-text ml-1">
              <div class="stat-title">Dossiers</div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">{{ getDossiersComplets() }}</div>
                <div>Complet</div>
              </div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">
                  {{ getTotalAcquereurs() - getDossiersComplets() }}
                </div>
                <div>Incomplet</div>
              </div>
            </div>
          </v-col>

          <!-- Statistique 4 : Agréments -->
          <v-col
            cols="12"
            md="6"
            lg="3"
            class="d-flex text-left justify-center"
          >
            <div class="stat-icon">
              <PhCheckCircle :size="31" color="#90b7aa" weight="light" />
            </div>
            <div class="stat-text ml-1">
              <div class="stat-title">Agréments</div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">{{ getAgrements("valide") }}</div>
                <div>Accordé</div>
              </div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">{{ getAgrements("refuse") }}</div>
                <div>Refusé</div>
              </div>
              <div class="stat-subtitle d-flex justify-space-between">
                <div class="stat-value">{{ getAgrements("en attente") }}</div>
                <div class="mr-2">En attente</div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Troisième Card : Tableau des acquéreurs -->
      <v-card class="pa-4 mt-4" rounded="xl" elevation="0">
        <v-card-title
          class="mb-4 text-left d-flex justify-space-between align-center"
        >
          <span>Gestion des acquéreurs</span>
          <div>
            <v-btn
              v-for="(filter, index) in filters"
              :key="index"
              :color="filtreAgrement === filter.value ? '#0B4C4F' : ''"
              :variant="filtreAgrement === filter.value ? 'flat' : 'outlined'"
              class="filter-btn mr-2"
              @click="filtreAgrement = filter.value"
            >
              {{ filter.label }}
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <v-table dense class="custom-scroll">
            <thead>
              <tr>
                <th>Acquéreur</th>
                <th>Visite</th>
                <th class="text-center">Dossier d'agrément papier et CGU</th>
                <th class="text-center">Pièce d'identité</th>
                <th class="text-center">Plan de financement</th>
                <th class="text-center">Agrément</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(acquereur, index) in acquereursFiltres" :key="index">
                <!-- Acquéreur -->
                <td class="text-left">
                  <div>{{ acquereur.prenom }} {{ acquereur.nom }}</div>
                  <div>{{ acquereur.telephone }}</div>
                  <div>{{ acquereur.mail }}</div>
                </td>

                <!-- Colonnes dynamiques pour les cases à cocher -->
                <td
                  class="text-center"
                  v-for="(property, propIndex) in [
                    'visite',
                    'papierCgu',
                    'pieceIdentite',
                    'planFinancement',
                  ]"
                  :key="propIndex"
                >
                  <component
                    :is="
                      acquereur[property] == 'true' ? PhCheckCircle : PhCircle
                    "
                    :size="24"
                    :color="acquereur[property] == 'true' ? 'black' : 'grey'"
                    @click="updateAcquereur(acquereur, property)"
                    class="cursor-pointer"
                  />
                </td>

                <!-- Agrément -->
                <td>
                  <v-select
                    v-model="acquereur.agrement"
                    @update:modelValue="updateAcquereur(acquereur, false)"
                    :items="agrements"
                    item-title="label"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="min-width: 150px"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
  <v-snackbar v-model="snackbar" timeout="3000">
    {{ message }}
  </v-snackbar>
</template>
<script setup>
import {
  PhUsers,
  PhHouse,
  PhFolder,
  PhCheckCircle,
  PhCircle,
} from "@phosphor-icons/vue";
import { defineProps, reactive, computed, ref } from "vue";

const snackbar = ref(false);
const message = ref("");
const props = defineProps({
  biens: {
    type: Object,
    required: true,
  },
});
const filters = [
  { label: "Tous", value: null },
  { label: "Accordés", value: "valide" },
  { label: "En Attente", value: "en attente" },
  { label: "Refusés", value: "refuse" },
];

// Création d'une copie réactive de l'objet 'bien' pour éviter les mutations directes

const editableBien = reactive(props.biens);

// Options pour le v-select
const agrements = [
  { label: "Accordé", value: "valide" },
  { label: "En attente", value: "en attente" },
  { label: "Refusé", value: "refuse" },
];

// Filtre pour les acquéreurs
const filtreAgrement = ref(null);

// Computed pour filtrer les acquéreurs selon l'agrément
const acquereursFiltres = computed(() => {
  if (!filtreAgrement.value) return editableBien.acquereurs;
  return editableBien.acquereurs.filter(
    (a) => a.agrement === filtreAgrement.value
  );
});

// Méthode générique pour mettre à jour une propriété d'un acquéreur
const updateAcquereur = (acquereur, property) => {
  if (property !== false) {
    acquereur[property] = acquereur[property] == "true" ? "false" : "true";
  } else {
    console.log(acquereur.agrement);
  }
  updateDossierMeta(acquereur.id, acquereur); // 1234 = ID du post dossier
};

async function updateDossierMeta(dossierId, acquereur) {
  try {
    const token = await getJwtToken();

    const meta = {
      visite_effectuee: String(acquereur.visite),
      dossier_agrement: String(acquereur.papierCgu),
      piece_didentite: String(acquereur.pieceIdentite),
      plan_de_financement: String(acquereur.planFinancement),
      statut_global: String(acquereur.agrement),
    };

    const res = await fetch(
      `https://illiz.fr/wp-json/wp/v2/dossiers/${dossierId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ meta }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Erreur API");
    }

    message.value = "Mise à jour réussie !";
    snackbar.value = true;
  } catch (err) {
    message.value = "Erreur : " + err.message;
    snackbar.value = true;
  }
}

async function getJwtToken() {
  const response = await fetch("https://illiz.fr/wp-json/jwt-auth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: import.meta.env.VITE_JWT_USER,
      password: import.meta.env.VITE_JWT_PASS,
    }),
  });

  const data = await response.json();
  if (!data.token) throw new Error("Token JWT non reçu");
  return data.token;
}
// Fonction pour formater les visites
const formatVisite = (visite) => {
  const date = new Date(visite.dateDebut).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const heureDebut = new Date(visite.dateDebut).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const heureFin = new Date(visite.dateFin).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} à ${heureDebut} - ${heureFin}`;
};

// Méthode pour obtenir le nombre total d'acquéreurs
const getTotalAcquereurs = () => {
  return editableBien.acquereurs.length;
};

// Méthode pour obtenir le nombre d'acquéreurs ayant visité
const getAcquereursWithVisite = (hasVisited) => {
  return editableBien.acquereurs.filter(
    (acquereur) => acquereur.visite === hasVisited
  ).length;
};

// Méthode pour obtenir le nombre de dossiers complets
const getDossiersComplets = () => {
  return editableBien.acquereurs.filter(
    (acquereur) =>
      acquereur.pieceIdentite &&
      acquereur.planFinancement &&
      acquereur.papierCgu
  ).length;
};

// Méthode pour obtenir le nombre d'agréments par statut (pending, approved, rejected, null)
const getAgrements = (status) => {
  return editableBien.acquereurs.filter(
    (acquereur) => acquereur.agrement === status
  ).length;
};
</script>

<style scoped>
.filter-btn:hover {
  border-color: #213547;
}

.container {
  max-width: 1000px;
  margin: auto;
}

h3 {
  margin-top: 1rem;
}

.v-card-title {
  font-weight: bold;
}

.stat-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-right: 5px;
  background-color: #e4f5ed;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-text {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-weight: bold;
  font-size: 1rem;
}

.stat-subtitle {
  color: #9e9e9e;
  font-size: 0.875rem;
  margin-right: auto;
}

.stat-value {
  font-weight: bold;
  margin-right: 0.3rem;
}

.v-table {
  border: 2px solid #cfefe2;
  border-radius: 5px;
  max-height: 500px;
}

.v-table thead {
  background-color: #cfefe2;
  position: sticky;
  top: 0;
  z-index: 1;
}

.v-table th {
  padding: 0.75rem;
  text-align: left;
  font-weight: bold;
  color: #213547;
}

.v-table td {
  padding: 0.75rem;
  border-bottom: 2px solid #e0e0e0;
}

.v-table tr:last-child td {
  border-bottom: none;
}

.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #999 #cfefe2;
}
</style>
