import { useEffect, useState } from "react"

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Botão "Instalar app" (PWA) */
export function useInstallPrompt() {
  const [ev, setEv] = useState<BIPEvent | null>(null)
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEv(e as BIPEvent) }
    window.addEventListener("beforeinstallprompt", on)
    return () => window.removeEventListener("beforeinstallprompt", on)
  }, [])
  return ev ? async () => { await ev.prompt(); setEv(null) } : null
}
