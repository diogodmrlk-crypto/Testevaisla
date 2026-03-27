import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "client",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
  },
  build: {
    outDir: path.resolve(__dirname, "client/dist"),
    rollupOptions: {
      external: []
    }
  }
});
