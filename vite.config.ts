import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"

export default defineConfig({
  // Caminhos relativos: funciona no GitHub Pages (/<repo>/) e em qualquer hospedagem
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Folia — finanças pessoais",
        short_name: "Folia",
        description: "Gestão financeira pessoal que funciona offline.",
        lang: "pt-BR",
        theme_color: "#3B82F6",
        background_color: "#090B12",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: { cleanupOutdatedCaches: true, skipWaiting: true, clientsClaim: true, globPatterns: ["**/*.{js,css,html,svg,png,woff2}"], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "charts", test: /node_modules[\\/](recharts|d3-|victory|@reduxjs|react-redux)/ },
            { name: "vendor", test: /node_modules/ },
          ],
        },
      },
    },
  },
})
