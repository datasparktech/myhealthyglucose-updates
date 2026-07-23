import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from the app subdomain root: https://app.myhealthyglucose.com
// If you ever host it under a subpath, change `base` to that path.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: { outDir: "dist" },
});
