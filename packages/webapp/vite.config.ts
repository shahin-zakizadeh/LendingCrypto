import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/pages": resolve(__dirname, "./src/pages"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/layouts": resolve(__dirname, "./src/layouts"),
      "@/assets": resolve(__dirname, "./src/assets"),
      "@/theme": resolve(__dirname, "./src/theme"),
      "@/utils": resolve(__dirname, "./src/utils"),
    },
  },
});
