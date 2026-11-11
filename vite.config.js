import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "client/public",
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
