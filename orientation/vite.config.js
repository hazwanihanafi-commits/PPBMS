import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  base: "/orientation/",

  build: {
    outDir: path.resolve(
      __dirname,
      "../frontend/public/orientation"
    ),

    emptyOutDir: true,
  },

  server: {
    port: 5173,
  },
});
