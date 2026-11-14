import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SimpleSelect } from "@/components/simple-select"
import { useStore } from "@/lib/store"
import { useSelectedMonth } from "@/lib/use-month"
import { monthLabel } from "@/lib/format"

export function MonthPicker() {
  const months = useStore((s) => s.months)
  const setSelected = useStore((s) => s.setSelectedMonth)
  const month = useSelectedMonth()
  const idx = months.findIndex((m) => m.id === month)
  const opts = [...months].reverse().map((m) => ({ value: m.id, label: monthLabel(m.id) }))
  if (idx < 0 && month) opts.unshift({ value: month, label: monthLabel(month) })
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" disabled={idx <= 0} onClick={() => setSelected(months[idx - 1].id)}>
        <ChevronLeft />
      </Button>
      <SimpleSelect value={month} onChange={setSelected} options={opts} className="w-40" size="sm" />
      <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" disabled={idx < 0 || idx >= months.length - 1} onClick={() => setSelected(months[idx + 1].id)}>
        <ChevronRight />
      </Button>
    </div>
  )
}
