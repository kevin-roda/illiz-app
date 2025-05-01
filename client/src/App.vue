<template>
  ok
  <v-app>
    <v-text-field
      label="Email address"
      placeholder="johndoe@gmail.com"
      type="email"
      v-model="enchereData.email"
    ></v-text-field>

    <enchere v-if="enchereData.email.length > 10" :data="enchereData" />
  </v-app>
</template>
<script setup>
import enchere from "./components/encheres.vue";
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
