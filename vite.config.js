import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
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
          { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/gpzmglcxmbboxxogbibq\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "supabase-cache", networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
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
