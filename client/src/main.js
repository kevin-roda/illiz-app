import { createApp } from "vue";
import Encheres from "./components/encheres.vue";
import StatistiquesVente from "./components/statistiquesVente.vue";
// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// import PhosphorIcons from "@phosphor-icons/vue";

const vuetify = createVuetify({
  components,
  directives,
});

document.addEventListener("DOMContentLoaded", () => {
  const enchereEl = document.getElementById("enchere-live");
  if (enchereEl) {
    const data = JSON.parse(enchereEl.dataset.config || "{}");
    console.log(data);

    const app = createApp(Encheres, { data });
    app.use(vuetify);
    app.mount("#enchere-live");
  }

  const statistiquesEl = document.getElementById("statistiques-vente");
  if (statistiquesEl) {
    const postId = statistiquesEl.dataset.postid;

    fetch(`/wp-json/wp/v2/nos-biens/${postId}`)
      .then((res) => res.json())
      .then((json) => {
        const data = JSON.parse(json.meta?.statistiques_vente || "{}");
        const app = createApp(StatistiquesVente, { data, mode: "detailed" });
        app.use(vuetify);
        app.mount("#statistiques-vente");
      });
  }
});
