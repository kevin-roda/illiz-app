<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

// Props : timestamp en ms (heure de Paris)
const props = defineProps({
  heureCible: {
    type: Number,
    required: true,
  },
});

// État local
const tempsRestant = ref(props.heureCible - Date.now());

// Recalcule si la prop change
watch(
  () => props.heureCible,
  (nouvelleHeure) => {
    tempsRestant.value = Math.max(nouvelleHeure - Date.now(), 0);
  }
);

// Formatage minutes / secondes
const heures = computed(() =>
  Math.floor((tempsRestant.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
);
const minutes = computed(() =>
  Math.floor((tempsRestant.value % (1000 * 60 * 60)) / (1000 * 60))
);
const secondes = computed(() =>
  Math.floor((tempsRestant.value % (1000 * 60)) / 1000)
);

let intervalId;

onMounted(() => {
  intervalId = setInterval(() => {
    const now = Date.now();
    tempsRestant.value = Math.max(props.heureCible - now, 0);
  }, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <div class="right">
    <p>Fin de la vente dans :</p>
    <div>{{ minutes }} : {{ secondes }}</div>
  </div>
</template>

<style scoped lang="scss">
.right {
  text-align: right;
  padding-right: 40px;
  p {
    color: var(--Vert-02, #45afa2);
    text-align: right;
    font-family: "Space Grotesk", Sans-serif;

    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: 150%;
  }
  div {
    color: var(--Vert-02, #45afa2);
    font-family: "Space Grotesk", Sans-serif;

    font-size: 30px;
    font-style: normal;
    font-weight: 900;
    line-height: 32px; /* 106.667% */
    letter-spacing: 2px;
  }
}
</style>
