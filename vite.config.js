import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
