import { createApp } from "vue";
import Encheres from "./components/encheres.vue";
import Acquereurs from "./components/acquereurs.vue";
import StatistiquesVente from "./components/statistiquesVente.vue";
import statsAdmin from "./components/statAdmin.vue";
// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const vuetify = createVuetify({
  components,
  directives,
});

function mountInShadowRoot(el, component, props = {}) {
  const shadowRoot = el.attachShadow({ mode: "open" });
  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  // Injecter les styles Vuetify dans le shadow DOM
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href =
    "https://cdn.jsdelivr.net/npm/vuetify@3.5.1/dist/vuetify.min.css"; // version à adapter
  shadowRoot.appendChild(styleLink);
  const styleilliz = document.createElement("link");
  styleilliz.rel = "stylesheet";
  styleilliz.href =
    "https://www.illiz.fr/wp-content/themes/hello-elementor/dist/illiz.css"; // version à adapter
  shadowRoot.appendChild(styleilliz);

  const app = createApp(component, props);
  app.use(vuetify);
  app.mount(mountPoint);
}

document.addEventListener("DOMContentLoaded", () => {
  const enchereEl = document.getElementById("enchere-live");
  if (enchereEl) {
    const data = JSON.parse(enchereEl.dataset.config || "{}");
    mountInShadowRoot(enchereEl, Encheres, { data });
  }

  const acqueEl = document.getElementById("tir-acquer");
  if (acqueEl) {
    const biens = JSON.parse(acqueEl.dataset.config || "{}");
    mountInShadowRoot(acqueEl, Acquereurs, { biens });
  }

  const statAdmin = document.getElementById("stat-admin");

  if (statAdmin) {
    const stats = JSON.parse(statAdmin.dataset.config || "{}");
    mountInShadowRoot(statAdmin, statsAdmin, { stats: stats });
  }
  // if (statAdmin) {
  //   const stats = JSON.parse(statAdmin.dataset.config || "{}");
  //   console.log(stats);

  //   const app = createApp(statsAdmin, { stats: stats });
  //   app.use(vuetify);
  //   app.mount("#app");
  // }

  const statistiquesEl = document.getElementById("statistiques-vente");
  if (statistiquesEl) {
    const postId = statistiquesEl.dataset.postid;

    fetch(`https://illiz.fr/wp-json/wp/v2/nos-biens/${postId}`)
      .then((res) => res.json())
      .then((json) => {
        const data = JSON.parse(json.meta?.statistiques_vente || "{}");
        mountInShadowRoot(statistiquesEl, StatistiquesVente, {
          data,
          mode: "detailed",
        });
      });
  }
});
