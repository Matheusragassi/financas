import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/money-input"
import { FieldLabel } from "@/components/field-label"
import { SimpleSelect } from "@/components/simple-select"
import { CardVisual } from "@/components/card-visual"
import { BANKS, NETWORKS, bankColor } from "@/lib/cards"
import { useStore } from "@/lib/store"
import { money } from "@/lib/format"
import type { CreditCard } from "@/lib/types"
import { cn } from "@/lib/utils"

const SWATCHES = ["#820AD1", "#3B82F6", "#EC7000", "#CC092F", "#11C76F", "#0D2C54", "#2B2B2B", "#E87BA4"]

export function CardDialog({ open, onOpenChange, card, onSaved }: {
  open: boolean; onOpenChange: (o: boolean) => void; card?: CreditCard | null; onSaved?: (id: string) => void
}) {
  const saveCard = useStore((s) => s.saveCard)
  const [bank, setBank] = useState("Nubank")
  const [name, setName] = useState("")
  const [network, setNetwork] = useState("")
  const [color, setColor] = useState(bankColor("Nubank"))
  const [limit, setLimit] = useState(0)
  const [dueDay, setDueDay] = useState("")

  useEffect(() => {
    if (!open) return
    setBank(card?.bank ?? "Nubank")
    setName(card?.name ?? "")
    setNetwork(card?.network ?? "")
    setColor(card?.color ?? bankColor(card?.bank ?? "Nubank"))
    setLimit(card?.limit ?? 0)
    setDueDay(card?.dueDay ? String(card.dueDay) : "")
  }, [open, card])

  const preview: CreditCard = { id: "p", bank, name: name || bank, network: network || undefined, color }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const day = parseInt(dueDay)
    const id = saveCard({
      id: card?.id, bank, name: name.trim() || bank, network: network || undefined, color,
      limit: limit || undefined, dueDay: day >= 1 && day <= 31 ? day : undefined,
    })
    toast.success(card ? "Cartão atualizado" : "Cartão adicionado")
    onOpenChange(false)
    onSaved?.(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{card ? "Editar cartão" : "Novo cartão"}</DialogTitle>
          <DialogDescription>Só para organizar seus gastos. Nenhum número ou dado do cartão é pedido.</DialogDescription>
        </DialogHeader>
        <CardVisual card={preview} className="mx-auto max-w-[300px]">
          {limit > 0 && <div className="text-[11px] opacity-80">Limite {money(limit)}</div>}
        </CardVisual>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <FieldLabel required>Banco</FieldLabel>
            <SimpleSelect value={bank} onChange={(v) => { setBank(v); if (!card) setColor(bankColor(v)) }} options={BANKS.map((b) => ({ value: b.name, label: b.name }))} />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel optional>Bandeira</FieldLabel>
            <SimpleSelect value={network || "none"} onChange={(v) => setNetwork(v === "none" ? "" : v)} options={[{ value: "none", label: "Não informar" }, ...NETWORKS.map((n) => ({ value: n, label: n }))]} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <FieldLabel htmlFor="card-name" optional>Apelido</FieldLabel>
            <Input id="card-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Ex.: ${bank} principal, ${bank} virtual…`} />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="card-limit" optional>Limite</FieldLabel>
            <MoneyInput id="card-limit" value={limit} onChange={setLimit} />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="card-due" optional>Vencimento (dia)</FieldLabel>
            <Input id="card-due" inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="10" />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <FieldLabel>Cor</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {[bankColor(bank), ...SWATCHES.filter((c) => c !== bankColor(bank))].map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Cor ${c}`}
                  className={cn("size-7 rounded-full ring-2 ring-offset-2 ring-offset-popover transition", color === c ? "ring-brand" : "ring-transparent hover:ring-border")}
                  style={{ background: c }} />
              ))}
              <label className="relative size-7 cursor-pointer overflow-hidden rounded-full ring-1 ring-border" title="Outra cor">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" />
                <span className="flex size-full items-center justify-center bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] text-[10px]" />
              </label>
            </div>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">{card ? "Salvar" : "Adicionar cartão"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
