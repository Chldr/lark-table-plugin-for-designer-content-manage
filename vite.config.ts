import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), legacy({})],
  server: {
    host: "0.0.0.0",
  },
  build: {
    assetsDir: "lark-table-plugin-for-designer-content-manage",
  },
});
