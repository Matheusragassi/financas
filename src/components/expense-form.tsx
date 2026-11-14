import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoneyInput } from "@/components/money-input"
import { FieldLabel } from "@/components/field-label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SimpleSelect } from "@/components/simple-select"
import { CardDialog } from "@/components/card-dialog"
import { isCreditMethod } from "@/lib/cards"
import { Plus } from "lucide-react"
import { useStore, type Scope } from "@/lib/store"
import { addMonths, money, monthLabel } from "@/lib/format"
import { KIND_LABEL, STATUS_LABEL, type Expense, type ExpenseKind, type ExpenseStatus } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  month: string
  expense?: Expense | null
}


export function ExpenseForm({ open, onOpenChange, month, expense }: Props) {
  const { settings, months, addExpense, updateExpense } = useStore()
  const editing = !!expense
  const [kind, setKind] = useState<ExpenseKind>("single")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState(0)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState("")
  const [method, setMethod] = useState("")
  const [m, setM] = useState(month)
  const [status, setStatus] = useState<ExpenseStatus>("pending")
  const [essential, setEssential] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState("")
  const [nTotal, setNTotal] = useState("")
  const [nCurrent, setNCurrent] = useState("1")
  const [note, setNote] = useState("")
  const [spread, setSpread] = useState(true)
  const [repeat, setRepeat] = useState("1")
  const [scope, setScope] = useState<Scope>("this")
  const [cardId, setCardId] = useState("")
  const [newCard, setNewCard] = useState(false)
  const cards = settings.cards ?? []
  const lastCardId = useStore((st) => [...st.expenses].reverse().find((x) => x.cardId)?.cardId ?? "")

  useEffect(() => {
    if (!open) return
    const e = expense
    setKind(e?.kind ?? "single")
    setDescription(e?.description ?? "")
    setAmount(e?.amount ?? 0)
    setTotal(e?.totalValue ?? 0)
    setCategory(e?.category ?? settings.categories[0] ?? "Outros")
    setMethod(e?.method ?? settings.methods[0] ?? "Outros")
    setM(e?.month ?? month)
    setStatus(e?.status ?? "pending")
    setEssential(e?.essential ?? false)
    setPurchaseDate(e?.purchaseDate ?? new Date().toISOString().slice(0, 10))
    setNTotal(e?.installmentTotal ? String(e.installmentTotal) : "")
    setNCurrent(e?.installmentCurrent ? String(e.installmentCurrent) : "1")
    setNote(e?.note ?? "")
    setSpread(true)
    setRepeat("1")
    setScope("this")
    setCardId(e ? e.cardId ?? "" : lastCardId || (settings.cards?.[0]?.id ?? ""))
  }, [open, expense, month, settings.categories, settings.methods]) // eslint-disable-line

  const monthOptions = useMemo(() => {
    const ids = new Set(months.map((x) => x.id))
    const last = months.at(-1)?.id ?? month
    for (let i = 1; i <= 12; i++) ids.add(addMonths(last, i))
    ids.add(month)
    return [...ids].sort().reverse().map((id) => ({ value: id, label: monthLabel(id) }))
  }, [months, month])

  const withCurrent = (list: string[], v: string) => (v && !list.includes(v) ? [...list, v] : list)
  const nT = parseInt(nTotal) || 0
  const nC = parseInt(nCurrent) || 1
  const isInst = kind === "installment"
  const remainingMonths = isInst && nT ? Math.max(0, nT - nC) : 0

  // Preenche parcela a partir do total
  const fillFromTotal = () => {
    if (total && nT) setAmount(Math.round((total / nT) * 100) / 100)
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    const value = amount
    if (!description.trim()) return toast.error("Informe a descrição.")
    if (!value) return toast.error("Informe o valor.")
    if (isInst && (!nT || nC > nT)) return toast.error("Confira as parcelas (atual não pode ser maior que o total).")
    const data = {
      month: m,
      description: description.trim(),
      category,
      method,
      amount: value,
      kind,
      purchaseDate: kind === "fixed" ? null : purchaseDate || null,
      installmentTotal: isInst ? nT : null,
      installmentCurrent: isInst ? nC : null,
      totalValue: total || (isInst ? value * nT : value),
      essential,
      status,
      lastInstallment: isInst ? nC === nT : false,
      note: note.trim() || undefined,
      cardId: isCreditMethod(method) && cardId ? cardId : undefined,
    }
    if (editing && expense) {
      const n = updateExpense(expense.id, data, scope)
      toast.success(n > 1 ? `${n} lançamentos atualizados` : "Lançamento atualizado")
    } else {
      const n = addExpense(data, { spread: isInst && spread, repeat: isInst ? 1 : parseInt(repeat) || 1 })
      toast.success(n > 1 ? `${n} lançamentos criados` : "Lançamento adicionado", { description: `${data.description} · ${money(value)}` })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            {editing ? "Altere os dados e escolha até onde a mudança vale." : "Registre um gasto. Parcelas e fixos podem ser lançados nos próximos meses automaticamente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Tabs value={kind} onValueChange={(v) => setKind(v as ExpenseKind)}>
            <TabsList className="w-full">
              {(Object.keys(KIND_LABEL) as ExpenseKind[]).map((k) => (
                <TabsTrigger key={k} value={k} className="text-xs sm:text-sm">{KIND_LABEL[k]}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <FieldLabel htmlFor="desc" required>Descrição</FieldLabel>
              <Input id="desc" autoFocus value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Mercado, Netflix, Notebook…" />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="amount" required>{isInst ? "Valor da parcela" : "Valor"}</FieldLabel>
              <MoneyInput id="amount" value={amount} onChange={setAmount} />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel required>Mês</FieldLabel>
              <SimpleSelect value={m} onChange={setM} options={monthOptions} />
            </div>

            {isInst && (
              <>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="ntotal" required>Total de parcelas</FieldLabel>
                  <Input id="ntotal" inputMode="numeric" className="num" value={nTotal} onChange={(e) => setNTotal(e.target.value.replace(/\D/g, ""))} placeholder="10" />
                </div>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="ncur" required>Parcela atual</FieldLabel>
                  <Input id="ncur" inputMode="numeric" className="num" value={nCurrent} onChange={(e) => setNCurrent(e.target.value.replace(/\D/g, ""))} placeholder="1" />
                </div>
              </>
            )}
            {kind !== "fixed" && (
              <>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="total" optional>Valor total da compra</FieldLabel>
                  <div className="flex gap-2">
                    <MoneyInput id="total" value={total} onChange={setTotal} />
                    {isInst && <Button type="button" variant="outline" onClick={fillFromTotal} title="Calcular parcela">÷</Button>}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="pdate" optional>Data da compra</FieldLabel>
                  <Input id="pdate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                </div>
              </>
            )}
            <div className="grid gap-1.5">
              <FieldLabel required>Categoria</FieldLabel>
              <SimpleSelect value={category} onChange={setCategory} options={withCurrent(settings.categories, category).map((c) => ({ value: c, label: c }))} />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel required>Método de pagamento</FieldLabel>
              <SimpleSelect value={method} onChange={setMethod} options={withCurrent(settings.methods, method).map((c) => ({ value: c, label: c }))} />
            </div>
            {isCreditMethod(method) && (
              <div className="grid gap-1.5 sm:col-span-2">
                <FieldLabel optional>Cartão</FieldLabel>
                <div className="flex gap-2">
                  {cards.length > 0 && (
                    <SimpleSelect value={cardId || "none"} onChange={(v) => setCardId(v === "none" ? "" : v)}
                      options={[...cards.map((c) => ({ value: c.id, label: `${c.name} · ${c.bank}` })), { value: "none", label: "Não informar" }]} />
                  )}
                  <Button type="button" variant="outline" className={cards.length ? "" : "w-full"} onClick={() => setNewCard(true)}>
                    <Plus /> {cards.length ? "Novo" : "Cadastrar cartão"}
                  </Button>
                </div>
              </div>
            )}
            <div className="grid gap-1.5">
              <FieldLabel required>Status</FieldLabel>
              <SimpleSelect value={status} onChange={(v) => setStatus(v as ExpenseStatus)} options={(Object.keys(STATUS_LABEL) as ExpenseStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))} />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:mt-6">
              <span className="text-sm">Gasto essencial</span>
              <Switch checked={essential} onCheckedChange={setEssential} />
            </label>
            <div className="grid gap-1.5 sm:col-span-2">
              <FieldLabel htmlFor="note" optional>Observação</FieldLabel>
              <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: comprado na promoção" />
            </div>
          </div>

          {!editing && isInst && remainingMonths > 0 && (
            <label className="flex items-start gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <Checkbox checked={spread} onCheckedChange={(v) => setSpread(!!v)} className="mt-0.5" />
              <span>
                Lançar também as <b>{remainingMonths}</b> parcelas restantes nos próximos meses
                <span className="block text-muted-foreground">Até {monthLabel(addMonths(m, remainingMonths))}</span>
              </span>
            </label>
          )}
          {!editing && (kind === "fixed" || kind === "subscription") && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <span className="flex-1">Repetir este gasto por quantos meses?</span>
              <Input className="w-20" inputMode="numeric" value={repeat} onChange={(e) => setRepeat(e.target.value.replace(/\D/g, ""))} />
            </div>
          )}
          {editing && (
            <div className="grid gap-1.5 rounded-lg bg-muted/60 p-3">
              <Label>Aplicar alterações em</Label>
              <SimpleSelect value={scope} onChange={(v) => setScope(v as Scope)} options={[
                { value: "this", label: "Somente este mês" },
                { value: "future", label: "Este e os meses seguintes" },
                { value: "all", label: "Todos os meses deste item" },
              ]} />
              <p className="text-xs text-muted-foreground">Útil para atualizar o preço de uma assinatura ou conta fixa de uma vez.</p>
            </div>
          )}

          <DialogFooter className="items-center">
            <span className="mr-auto hidden text-xs text-muted-foreground sm:block"><span className="text-critical">*</span> obrigatório</span>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{editing ? "Salvar alterações" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CardDialog open={newCard} onOpenChange={setNewCard} onSaved={setCardId} />
    </Dialog>
  )
}
