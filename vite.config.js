import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      includeAssets: ["favicon.svg", "logo.png", "logo-transparente-122x122.png"],
      manifest: {
        name: "Stickframe Gestão",
        short_name: "Stickframe",
        description: "Sistema de gestão para construtoras de Steel Frame",
        theme_color: "#981915",
        background_color: "#f0f0f3",
        display: "standalone",
        icons: [
          { src: "/logo-transparente-122x122.png", sizes: "122x122", type: "image/png" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        calcular: resolve(__dirname, "calcular.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("@thatopen") || id.includes("web-ifc")) return "bim-engine";
          if (id.includes("three"))                                 return "three";
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
