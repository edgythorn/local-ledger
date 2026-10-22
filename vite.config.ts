import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  // GitHub Pages hosts this project under /local-ledger/.
  // Override with VITE_BASE_PATH=/ when deploying to a domain root.
  base: process.env.VITE_BASE_PATH ?? "/local-ledger/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
