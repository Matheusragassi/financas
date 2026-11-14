import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "next-themes"
import "./index.css"
import App from "./App.tsx"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { startSync } from "@/lib/sync"
import { registerSW } from "virtual:pwa-register"
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill"

// Bandeiras em emoji também no Windows (fonte embutida, funciona offline)
polyfillCountryFlagEmojis("Twemoji Country Flags", "./TwemojiCountryFlags.woff2")

// Atualiza o app sozinho quando sai uma versão nova (recarrega ao ativar)
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return
    const check = () => { if (navigator.onLine) void reg.update() }
    setInterval(check, 30 * 60 * 1000)
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check() })
  },
})

startSync()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <App />
        <Toaster position="bottom-right" visibleToasts={4} offset={20} mobileOffset={{ bottom: 92, left: 16, right: 16 }} closeButton />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
