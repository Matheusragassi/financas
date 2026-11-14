import { useEffect, useState } from "react"
import { useStore } from "./store"

/** true quando o estado persistido já foi carregado do aparelho */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated())
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useStore.persist.hasHydrated())
    return unsub
  }, [])
  return hydrated
}
