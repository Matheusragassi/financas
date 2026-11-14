import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ArrowUpDown, Check, CreditCard as CreditCardIcon, CircleDashed, Copy, Download, MoreHorizontal, Pencil, Search, ShieldCheck, Trash2, X, Ban, Filter,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { SimpleSelect } from "@/components/simple-select"
import { ExpenseForm } from "@/components/expense-form"
import { InlineMoney } from "@/components/inline-money"
import { useStore } from "@/lib/store"
import { useSelectedMonth } from "@/lib/use-month"
import { formatDate, money, monthLabel } from "@/lib/format"
import { downloadCsv } from "@/lib/backup"
import { KIND_LABEL, STATUS_LABEL, type Expense, type ExpenseKind, type ExpenseStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CardChip } from "@/components/card-visual"
import { TablePager, TableScroll, tableCardClass, usePagination } from "@/components/table-pager"
import { Inbox } from "lucide-react"

type SortKey = "description" | "amount" | "category" | "default"

export function Expenses() {
  const { expenses, setStatus, removeMany, removeExpense, duplicateExpense, updateExpense, months, settings, assignCard } = useStore()
  const cards = settings.cards ?? []
  const cardOf = (id?: string) => cards.find((c) => c.id === id)
  const month = useSelectedMonth()
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")
  const [method, setMethod] = useState("all")
  const [status, setStatusF] = useState("all")
  const [kind, setKind] = useState("all")
  const [card, setCard] = useState("all")
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "default", dir: 1 })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<Expense | null>(null)
  const [removing, setRemoving] = useState<Expense | null>(null)
  const [allMonths, setAllMonths] = useState(false)

  const base = useMemo(() => expenses.filter((e) => allMonths || e.month === month), [expenses, month, allMonths])
  const cats = useMemo(() => [...new Set(base.map((e) => e.category))].sort(), [base])
  const methods = useMemo(() => [...new Set(base.map((e) => e.method))].sort(), [base])

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    const r = base.filter((e) =>
      (!term || e.description.toLowerCase().includes(term) || e.note?.toLowerCase().includes(term)) &&
      (cat === "all" || e.category === cat) &&
      (method === "all" || e.method === method) &&
      (status === "all" || e.status === status) &&
      (kind === "all" || e.kind === kind) &&
      (card === "all" || (card === "none" ? !cardOf(e.cardId) : e.cardId === card)))
    if (sort.key === "default") return allMonths ? [...r].sort((a, b) => b.month.localeCompare(a.month)) : r
    return [...r].sort((a, b) => {
      const k = sort.key as "description" | "amount" | "category"
      const va = a[k], vb = b[k]
      return (typeof va === "number" ? va - (vb as number) : String(va).localeCompare(String(vb))) * sort.dir
    })
  }, [base, q, cat, method, status, kind, card, sort, allMonths]) // eslint-disable-line

  const pg = usePagination(rows, "lancamentos", 20)
  useEffect(() => pg.setPage(0), [q, cat, method, status, kind, card, allMonths, month]) // eslint-disable-line
  const visibleTotal = rows.filter((e) => e.status !== "cancelled").reduce((a, e) => a + e.amount, 0)
  const filtersOn = [cat, method, status, kind, card].filter((f) => f !== "all").length
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const sel = [...selected].filter((id) => rows.some((r) => r.id === id))

  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "amount" ? -1 : 1 }))

  function exportCsv() {
    downloadCsv([
      ["Mês", "Descrição", "Tipo", "Categoria", "Método", "Parcela", "Valor", "Valor total", "Data da compra", "Essencial", "Status"],
      ...rows.map((e) => [monthLabel(e.month), e.description, KIND_LABEL[e.kind], e.category, e.method,
        e.installmentTotal ? `${e.installmentCurrent}/${e.installmentTotal}` : "", e.amount.toFixed(2).replace(".", ","),
        e.totalValue ? e.totalValue.toFixed(2).replace(".", ",") : "", formatDate(e.purchaseDate), e.essential ? "Sim" : "Não", STATUS_LABEL[e.status]]),
    ], `gastos-${allMonths ? "todos" : month}.csv`)
  }

  return (
    <div className="flex min-h-[calc(100dvh-13rem)] flex-col gap-4 md:min-h-[calc(100dvh-11rem)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{allMonths ? "Todos os meses" : "Lançamentos de"}</p>
          <h2 className="text-2xl font-semibold tracking-tight">{allMonths ? `${months.length} meses` : monthLabel(month)}</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{rows.length} itens {filtersOn || q ? "filtrados" : ""}</p>
          <p className="num text-2xl font-semibold tracking-tight">{money(visibleTotal)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar gasto…" className="pl-8" />
        </div>
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <Filter /> Filtros {filtersOn > 0 && <Badge className="ml-1 h-4 px-1.5">{filtersOn}</Badge>}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <FilterSelect label="Tipo" value={kind} onChange={setKind} options={(Object.keys(KIND_LABEL) as ExpenseKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
            <FilterSelect label="Categoria" value={cat} onChange={setCat} options={cats.map((c) => ({ value: c, label: c }))} />
            <FilterSelect label="Método" value={method} onChange={setMethod} options={methods.map((c) => ({ value: c, label: c }))} />
            {cards.length > 0 && <FilterSelect label="Cartão" value={card} onChange={setCard} options={[...cards.map((c) => ({ value: c.id, label: c.name })), { value: "none", label: "Sem cartão" }]} />}
            <FilterSelect label="Status" value={status} onChange={setStatusF} options={(Object.keys(STATUS_LABEL) as ExpenseStatus[]).map((k) => ({ value: k, label: STATUS_LABEL[k] }))} />
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={allMonths} onCheckedChange={(v) => setAllMonths(!!v)} /> Buscar em todos os meses</label>
            {filtersOn > 0 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { setCat("all"); setMethod("all"); setStatusF("all"); setKind("all"); setCard("all") }}>
                <X /> Limpar filtros
              </Button>
            )}
          </PopoverContent>
        </Popover>
        <Button variant="outline" onClick={exportCsv}><Download /> <span className="hidden sm:inline">CSV</span></Button>
      </div>

      {sel.length > 0 && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border bg-popover p-2 shadow-lg">
          <span className="px-2 text-sm font-medium">{sel.length} selecionados</span>
          <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "paid"); toast.success("Marcados como pagos") }}><Check /> Pago</Button>
          <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "pending"); toast.success("Marcados como pendentes") }}><CircleDashed /> Pendente</Button>
          <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "cancelled"); toast.success("Marcados como cancelados") }}><Ban /> Cancelar</Button>
          {cards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" variant="secondary" />}><CreditCardIcon /> Cartão</DropdownMenuTrigger>
              <DropdownMenuContent>
                {cards.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => { assignCard(sel, c.id); toast.success(`${sel.length} vinculados a ${c.name}`) }}>
                    <CardChip card={c} />
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { assignCard(sel, undefined); toast.success("Cartão removido dos selecionados") }}>Sem cartão</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="sm" variant="destructive" onClick={() => { removeMany(sel); setSelected(new Set()); toast.success(`${sel.length} excluídos`) }}><Trash2 /> Excluir</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}><X /></Button>
        </div>
      )}

      <Card className={tableCardClass(true)}>
        <TableScroll empty={rows.length === 0 && (<><Inbox className="size-8 opacity-40" /><span>Nenhum lançamento encontrado.</span>{(filtersOn > 0 || q) && <span className="text-xs">Tente limpar a busca ou os filtros.</span>}</>)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4">
                <Checkbox checked={allChecked} onCheckedChange={(v) => setSelected(v ? new Set(rows.map((r) => r.id)) : new Set())} aria-label="Selecionar todos" />
              </TableHead>
              <TableHead><SortBtn onClick={() => sortBy("description")}>Descrição</SortBtn></TableHead>
              <TableHead className="hidden md:table-cell"><SortBtn onClick={() => sortBy("category")}>Categoria</SortBtn></TableHead>
              <TableHead className="hidden lg:table-cell">Método</TableHead>
              <TableHead className="hidden sm:table-cell">Parcela</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right"><SortBtn onClick={() => sortBy("amount")} className="ml-auto">Valor</SortBtn></TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.visible.map((e) => (
              <TableRow key={e.id} data-state={selected.has(e.id) ? "selected" : undefined} className={cn(e.status === "cancelled" && "opacity-55")}>
                <TableCell className="pl-4"><Checkbox checked={selected.has(e.id)} onCheckedChange={() => toggle(e.id)} aria-label="Selecionar" /></TableCell>
                <TableCell className="max-w-[14rem] sm:max-w-xs">
                  <button className="block w-full truncate text-left font-medium hover:underline" onClick={() => setEditing(e)}>
                    <span className={cn(e.status === "cancelled" && "line-through")}>{e.description}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {allMonths && <span>{monthLabel(e.month)} ·</span>}
                    <span>{KIND_LABEL[e.kind]}</span>
                    {e.essential && <span className="flex items-center gap-0.5"><ShieldCheck className="size-3" /> essencial</span>}
                    <span className="sm:hidden">· {STATUS_LABEL[e.status]}</span>
                    {e.kind === "installment" && <span className="sm:hidden">· {e.installmentCurrent}/{e.installmentTotal}</span>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{e.category}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{cardOf(e.cardId) ? <CardChip card={cardOf(e.cardId)} className="text-foreground/80" /> : e.method}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {e.kind === "installment" ? (
                    <span className={cn("num text-sm", e.installmentCurrent === e.installmentTotal && "font-medium text-success")}>
                      {e.installmentCurrent}/{e.installmentTotal}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell"><StatusBadge status={e.status} onClick={() => setStatus([e.id], e.status === "paid" ? "pending" : "paid")} /></TableCell>
                <TableCell className="text-right">
                  <InlineMoney value={e.amount} onSave={(v) => { updateExpense(e.id, { amount: v }); toast.success("Valor atualizado", { description: `${e.description}: ${money(v)}` }) }} />
                </TableCell>
                <TableCell className="pr-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ações" />}><MoreHorizontal /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setEditing(e)}><Pencil /> Editar</DropdownMenuItem>
                      {e.status !== "paid" && <DropdownMenuItem onClick={() => setStatus([e.id], "paid")}><Check /> Marcar como pago</DropdownMenuItem>}
                      {e.status !== "pending" && <DropdownMenuItem onClick={() => setStatus([e.id], "pending")}><CircleDashed /> Marcar como pendente</DropdownMenuItem>}
                      {e.status !== "cancelled" && <DropdownMenuItem onClick={() => setStatus([e.id], "cancelled")}><Ban /> Marcar como cancelado</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => { duplicateExpense(e.id); toast.success("Duplicado") }}><Copy /> Duplicar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setRemoving(e)}><Trash2 /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="pl-4">Total (sem cancelados)</TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className="hidden lg:table-cell" />
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="num pr-4 text-right font-semibold">{money(visibleTotal)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
        </TableScroll>
        <TablePager p={pg} label="lançamentos" />
      </Card>
      <p className="text-xs text-muted-foreground">Dica: clique no valor para atualizar o preço na hora; clique no status para alternar entre pago e pendente.</p>

      <ExpenseForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} month={month} expense={editing} />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{removing?.description}”?</AlertDialogTitle>
            <AlertDialogDescription>Escolha se quer remover só deste mês ou também dos meses seguintes. Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={() => { const n = removeExpense(removing!.id, "future"); toast.success(`${n} lançamentos excluídos`); setRemoving(null) }}>Este e os próximos</Button>
            <Button variant="destructive" onClick={() => { removeExpense(removing!.id, "this"); toast.success("Lançamento excluído"); setRemoving(null) }}>Só este mês</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SortBtn({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-1 hover:text-foreground", className)}>
      {children} <ArrowUpDown className="size-3 opacity-50" />
    </button>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <SimpleSelect value={value} onChange={onChange} options={[{ value: "all", label: "Todos" }, ...options]} />
    </div>
  )
}

export function StatusBadge({ status, onClick }: { status: ExpenseStatus; onClick?: () => void }) {
  const cls = {
    paid: "bg-success/12 text-success ring-success/25",
    pending: "bg-warning/12 text-warning ring-warning/25",
    cancelled: "bg-muted text-muted-foreground ring-border",
  }[status]
  const Icon = { paid: Check, pending: CircleDashed, cancelled: Ban }[status]
  return (
    <button type="button" onClick={onClick} disabled={!onClick || status === "cancelled"} title={onClick ? "Alternar pago/pendente" : undefined}
      className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium ring-1 transition hover:brightness-110", cls)}>
      <Icon className="size-3" /> {STATUS_LABEL[status]}
    </button>
  )
}
