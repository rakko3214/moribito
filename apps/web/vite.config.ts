import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { offlineBundle } from "./build/offlineBundle.js";
export default defineConfig({ plugins: [react(), offlineBundle()], server: { host: "0.0.0.0", port: 5173 }, preview: { host: "0.0.0.0", port: 4173 } });
