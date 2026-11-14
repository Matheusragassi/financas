import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowRight, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { SimpleSelect } from "@/components/simple-select"
import { FieldLabel } from "@/components/field-label"
import { CURRENCIES, currencyOf } from "@/lib/currency"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Mostra a moeda atual e abre o assistente de troca (só símbolo ou conversão de todos os valores) */
export function CurrencyField({ className }: { className?: string }) {
  const code = useStore((s) => s.settings.currency ?? "BRL")
  const [open, setOpen] = useState(false)
  const cur = currencyOf(code)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={cn("flex h-9 w-full items-center gap-2.5 rounded-lg border border-input px-3 text-left text-sm transition hover:bg-foreground/[0.03] active:scale-[0.99] dark:bg-input/30", className)}>
        <span className="flex size-5 items-center justify-center text-base leading-none">{cur.flag}</span>
        <span className="flex-1 truncate">{cur.name}</span>
        <span className="text-xs text-muted-foreground">{cur.symbol} · Trocar</span>
      </button>
      <CurrencyDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function CurrencyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { settings, expenses, changeCurrency } = useStore()
  const from = currencyOf(settings.currency ?? "BRL")
  const [to, setTo] = useState(from.code)
  const [mode, setMode] = useState<"symbol" | "convert">("symbol")
  const [rate, setRate] = useState("")
  const [loading, setLoading] = useState(false)
  const target = currencyOf(to)

  useEffect(() => { if (open) { setTo(from.code); setMode("symbol"); setRate("") } }, [open, from.code])

  async function fetchRate() {
    setLoading(true)
    try {
      const r = await fetch(`https://api.frankfurter.app/latest?from=${from.code}&to=${to}`)
      const j = await r.json()
      const v = j?.rates?.[to]
      if (!v) throw new Error()
      setRate(String(v).replace(".", ","))
      toast.success(`Cotação de hoje: 1 ${from.code} = ${v} ${to}`)
    } catch {
      toast.error("Não consegui buscar a cotação dessa moeda. Digite o valor manualmente.")
    } finally { setLoading(false) }
  }

  const rateNum = Number(rate.replace(/\./g, "").replace(",", ".")) || 0
  function apply() {
    if (to === from.code) return onOpenChange(false)
    if (mode === "convert" && !rateNum) return toast.error("Informe a cotação para converter.")
    changeCurrency(to, mode === "convert" ? rateNum : undefined)
    toast.success(mode === "convert" ? `Valores convertidos para ${target.name}` : `Moeda alterada para ${target.name}`,
      { description: mode === "convert" ? `${expenses.length} lançamentos, rendas e limites atualizados.` : "Os valores foram mantidos." })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Moeda do app</DialogTitle>
          <DialogDescription>A troca vale para a interface e para a sua planilha no Google.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel required>Nova moeda</FieldLabel>
            <SimpleSelect value={to} onChange={setTo} options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.flag}  ${c.name} (${c.symbol})` }))} />
          </div>
          {to !== from.code && (
            <>
              <div className="grid gap-2">
                {([
                  ["symbol", "Só trocar o símbolo", `Os números continuam iguais (ex.: ${from.symbol} 100 vira ${target.symbol} 100).`],
                  ["convert", "Converter todos os valores", "Multiplica lançamentos, rendas e limites pela cotação."],
                ] as const).map(([v, t, d]) => (
                  <button key={v} type="button" onClick={() => setMode(v)}
                    className={cn("rounded-xl p-3 text-left ring-1 transition", mode === v ? "bg-brand/10 ring-brand/50" : "ring-foreground/10 hover:bg-foreground/[0.03]")}>
                    <span className="block text-sm font-medium">{t}</span>
                    <span className="block text-xs text-muted-foreground">{d}</span>
                  </button>
                ))}
              </div>
              {mode === "convert" && (
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="fx" required>Cotação</FieldLabel>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="shrink-0 text-muted-foreground">1 {from.code} =</span>
                    <Input id="fx" className="num" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="0,00" />
                    <span className="shrink-0 text-muted-foreground">{to}</span>
                    <Button type="button" variant="outline" size="icon" onClick={fetchRate} disabled={loading} title="Buscar cotação de hoje">
                      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                    </Button>
                  </div>
                  {rateNum > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Exemplo: {from.symbol} 1.000 <ArrowRight className="size-3" /> {target.symbol} {(1000 * rateNum).toLocaleString(target.locale, { maximumFractionDigits: target.decimals })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={apply} disabled={to === from.code}>
            {mode === "convert" && to !== from.code ? "Converter valores" : "Trocar moeda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
