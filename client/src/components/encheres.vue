<template>
  <div class="rk_container">
    <div class="rk_head">
      <div class="left">
        <h2>Participants à la vente</h2>
        <p>
          Toute offre soumise dans les 5 dernières min de la fin du compte à
          prolonge automatiquement de la vente de 5min.
        </p>
      </div>
      <decompte :heureCible="finEnchere" />
    </div>

    <v-table ref="tableRef" class="rk_encherTable" height="310px" fixed-header>
      <thead>
        <tr class="enchere-row-title">
          <th class="text-left">Offres</th>
          <th class="text-left">Participants</th>
          <th class="text-left">Heure</th>
        </tr>
      </thead>
      <transition-group tag="tbody" name="fade-slide" appear>
        <tr
          v-for="item in encheresOrdonnees"
          :key="item.heure"
          class="enchere-row"
          :class="{ 'is-us': item.email == props.data.email }"
        >
          <td>{{ item.prix }}</td>
          <td>
            {{
              item.email == props.data.email
                ? "vous"
                : "participant :" + item.participant
            }}
          </td>
          <td>{{ item.heureLisible }}</td>
        </tr>
      </transition-group>
    </v-table>

    <v-btn
      variant="flat"
      class="rk_btn-e"
      color="#45AFA2"
      @click="faireOffre"
      :disabled="boutonDesactive"
    >
      Faire une offre
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12.5" cy="12.5" r="12" fill="white" />
        <g clip-path="url(#clip0_460_9513)">
          <path
            d="M12.5 6.8999V18.0999"
            stroke="#467D7E"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M6.8999 12.5H18.0999"
            stroke="#467D7E"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_460_9513">
            <rect
              width="19.2"
              height="19.2"
              fill="white"
              transform="translate(2.8999 2.8999)"
            />
          </clipPath>
        </defs>
      </svg>
    </v-btn>

    <p v-if="derniereMinute" style="color: red; font-weight: bold">
      ⏳ Dernière minute pour faire une offre !
    </p>
    <p class="pasoffre">Le palier des offres est de {{ palier }} €</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import decompte from "./decompte.vue";

let socket;
const encheresOrdonnees = ref([]);
const prixDepart = ref(0);
const palier = ref(2000);
const finEnchere = ref(0);
const props = defineProps({
  data: Object,
});

// Sécuriser temporairement le bouton après clic
const boutonDisabledTemporaire = ref(false);

// Temps restant = calculé dynamiquement
const tempsRestant = computed(() => Math.max(0, finEnchere.value - Date.now()));

// Vente terminée
const enchereTerminee = computed(() => tempsRestant.value <= 0);

// Dernière minute
const derniereMinute = computed(
  () => tempsRestant.value <= 60_000 && tempsRestant.value > 0
);

// Désactiver bouton si vente terminée OU clic en attente
const boutonDesactive = computed(
  () => enchereTerminee.value || boutonDisabledTemporaire.value
);

function organiserEncheres(encheres) {
  return encheres
    .slice()
    .sort((a, b) => b.heure - a.heure)
    .map((enchere) => {
      const date = new Date(enchere.heure);
      const options = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Europe/Paris",
      };
      return {
        ...enchere,
        heureLisible: date.toLocaleTimeString("fr-FR", options),
        highlight: false,
      };
    });
}

function faireOffre() {
  if (boutonDesactive.value) {
    alert(
      "Action impossible (attendez quelques secondes ou la vente est finie)."
    );
    return;
  }

  socket.emit("faire_offre");

  // Désactiver pendant 5 secondes
  boutonDisabledTemporaire.value = true;
  setTimeout(() => {
    boutonDisabledTemporaire.value = false;
  }, 5000);
}

onMounted(() => {
  socket = io("https://sei.illiz.fr", {
    // socket = io("http://localhost:3001", {
    query: {
      email: props.data.email,
      roomId: props.data.roomId,
      prenom: props.data.prenom,
      nom: props.data.nom,
    },
  });

  socket.on("connect", () => {
    console.log("Connecté au serveur", socket.id);
  });

  socket.on("init", (data) => {
    encheresOrdonnees.value = organiserEncheres(data.encheres || []);
    prixDepart.value = data.prix_depart || 0;
    palier.value = data.palier || 2000;
    finEnchere.value = data.fin_enchere || Date.now() + 3600000;
  });

  socket.on("nouvelle_offre", (nouvelleOffre) => {
    encheresOrdonnees.value = organiserEncheres([
      nouvelleOffre,
      ...encheresOrdonnees.value,
    ]);
  });

  socket.on("prolongation", (data) => {
    finEnchere.value = data.fin_enchere;
    console.log(
      "Fin prolongée jusqu'à",
      new Date(finEnchere.value).toLocaleTimeString()
    );
  });

  socket.on("error", (err) => {
    console.error("Erreur serveur :", err.message);
  });
});

onUnmounted(() => {
  if (socket) socket.disconnect();
});
</script>

<style scoped lang="scss">
.rk_encherTable {
  border-radius: 20px;
  border: 1px solid #e9eaeb;
  background: #fff;
  box-shadow: 0px 4px 6px -2px rgba(0, 0, 0, 0.03),
    0px 12px 16px -4px rgba(0, 0, 0, 0.08);
  margin: 20px 0;
}

.fade-slide-enter-active {
  transition: all 0.5s ease;
}
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translatex(-100%);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translatex(0);
}

.is-us {
  background-color: #45afa2;
  color: white;
}
.enchere-row {
  font-family: "Space Grotesk", Sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
}
.enchere-row-title {
  color: var(--Vert-03, #094c50);
  font-family: "Space Grotesk", Sans-serif;
  font-size: 18px;
  font-style: normal;
  font-weight: 900;
  line-height: normal;
}
.rk_container {
  padding: 20px;

  .rk_head {
    display: flex;
    justify-content: space-between;
    > * {
      flex: 1;
    }
    .left {
      h2 {
        color: var(--Gris-fonc, #202020);
        font-family: "Space Grotesk", Sans-serif;

        font-size: 20px;
        font-style: normal;
        font-weight: 700;
        line-height: 150%;
      }
      p {
        color: var(--Gris-fonc, #202020);
        font-family: "Space Grotesk", Sans-serif;
        font-size: 14px;
        font-style: italic;
        font-weight: 300;
        line-height: 120%;
      }
    }
  }
}
.rk_btn-e {
  width: 100%;
  margin-bottom: 20px;
  svg {
    margin-left: 10px;
  }
}

.pasoffre {
  color: var(--Gris-fonc, #202020);
  text-align: center;
  font-family: "Space Grotesk", Sans-serif;

  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  letter-spacing: -0.064px;
}
</style>
