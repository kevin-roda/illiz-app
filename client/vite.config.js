import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { defineConfig as defineViteConfig } from "vite";

export default defineViteConfig({
  plugins: [vue()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"), // 🔥 ajouter ça
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      name: "Illiz",
      formats: ["iife"],
      fileName: () => "illiz.js",
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
