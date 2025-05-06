<template>
  <v-app>
    ok

    <stats></stats>
  </v-app>
</template>
<script setup>
import stats from "./components/statAdmin.vue";
import { ref } from "vue";

const enchereData = ref({
  email: "kevin@tes.fr",
  postId: 3430,
  prenom: "jean",
  nom: "mich",
});
</script>
<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
