import { useMemo } from "react"
import { useStore } from "./store"
import { currentMonthId } from "./format"

/** Mês selecionado (padrão: mês atual, ou o mais recente cadastrado) */
export function useSelectedMonth() {
  const months = useStore((s) => s.months)
  const selected = useStore((s) => s.selectedMonth)
  return useMemo(() => {
    if (selected) return selected
    const now = currentMonthId()
    if (months.some((m) => m.id === now)) return now
    const past = months.filter((m) => m.id <= now)
    return (past.at(-1) ?? months.at(-1))?.id ?? now
  }, [months, selected])
}
