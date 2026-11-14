import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Ban, Check, CircleDashed, Copy, CreditCard as CreditCardIcon, Download, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ExpenseForm } from "@/components/expense-form"
import { InlineMoney } from "@/components/inline-money"
import { DataTable, type Column } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { CardChip } from "@/components/card-visual"
import { tableCardClass } from "@/components/table-pager"
import { useStore } from "@/lib/store"
import { useSelectedMonth } from "@/lib/use-month"
import { formatDate, money, monthLabel } from "@/lib/format"
import { downloadCsv } from "@/lib/backup"
import { openStatus } from "@/lib/status"
import { KIND_LABEL, STATUS_LABEL, type Expense } from "@/lib/types"
import { cn } from "@/lib/utils"

export function Expenses() {
  const { expenses, setStatus, removeMany, removeExpense, duplicateExpense, updateExpense, months, settings, assignCard } = useStore()
  const cards = useMemo(() => settings.cards ?? [], [settings.cards])
  const cardOf = useCallback((id?: string) => cards.find((c) => c.id === id), [cards])
  const month = useSelectedMonth()
  const [editing, setEditing] = useState<Expense | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Expense | null>(null)
  const [allMonths, setAllMonths] = useState(false)
  const [filtered, setFiltered] = useState<Expense[]>([])

  const rows = useMemo(() => {
    const r = expenses.filter((e) => allMonths || e.month === month)
    return allMonths ? [...r].sort((a, b) => b.month.localeCompare(a.month)) : r
  }, [expenses, month, allMonths])
  const visibleTotal = filtered.filter((e) => e.status !== "cancelled").reduce((a, e) => a + e.amount, 0)
  const toggleStatus = (e: Expense) => setStatus([e.id], e.status === "paid" ? openStatus(e.method) : "paid")

  const columns = useMemo<Column<Expense>[]>(() => [
    {
      id: "description", header: "Descrição", fixed: true, className: "min-w-56 max-w-[22rem]",
      sortValue: (e) => e.description,
      cell: (e) => (
        <div className="min-w-0">
          <button className="block w-full truncate text-left font-medium hover:underline" onClick={() => setEditing(e)}>
            <span className={cn(e.status === "cancelled" && "line-through")}>{e.description}</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{KIND_LABEL[e.kind]}</span>
            {e.essential && <span className="flex items-center gap-0.5"><ShieldCheck className="size-3" /> essencial</span>}
            {e.note && <span className="truncate">· {e.note}</span>}
          </div>
        </div>
      ),
    },
    { id: "month", header: "Mês", defaultHidden: !allMonths, sortValue: (e) => e.month, filterValue: (e) => monthLabel(e.month), cell: (e) => <span className="whitespace-nowrap text-muted-foreground">{monthLabel(e.month)}</span> },
    { id: "kind", header: "Tipo", defaultHidden: true, filterValue: (e) => KIND_LABEL[e.kind], sortValue: (e) => KIND_LABEL[e.kind], cell: (e) => <span className="text-muted-foreground">{KIND_LABEL[e.kind]}</span> },
    { id: "category", header: "Categoria", sortValue: (e) => e.category, filterValue: (e) => e.category, cell: (e) => <span className="whitespace-nowrap text-muted-foreground">{e.category}</span> },
    {
      id: "method", header: "Pagamento", sortValue: (e) => cardOf(e.cardId)?.name ?? e.method,
      filterValue: (e) => cardOf(e.cardId)?.name ?? e.method,
      cell: (e) => cardOf(e.cardId) ? <CardChip card={cardOf(e.cardId)} className="whitespace-nowrap text-foreground/85" /> : <span className="whitespace-nowrap text-muted-foreground">{e.method}</span>,
    },
    {
      id: "installment", header: "Parcela", align: "center", sortValue: (e) => e.installmentTotal ? (e.installmentTotal - (e.installmentCurrent ?? 0)) : 999,
      filterValue: (e) => (e.kind === "installment" ? (e.installmentCurrent === e.installmentTotal ? "Última parcela" : "Em andamento") : "Sem parcelas"),
      cell: (e) => e.kind === "installment"
        ? <span className={cn("num", e.installmentCurrent === e.installmentTotal && "font-medium text-success")}>{e.installmentCurrent}/{e.installmentTotal}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    { id: "date", header: "Compra", defaultHidden: true, sortValue: (e) => e.purchaseDate ?? "", cell: (e) => <span className="num whitespace-nowrap text-muted-foreground">{formatDate(e.purchaseDate)}</span> },
    { id: "status", header: "Status", sortValue: (e) => STATUS_LABEL[e.status], filterValue: (e) => STATUS_LABEL[e.status], cell: (e) => <StatusBadge status={e.status} onClick={() => toggleStatus(e)} /> },
    {
      id: "amount", header: "Valor", align: "right", fixed: true, sortValue: (e) => e.amount,
      cell: (e) => <InlineMoney value={e.amount} onSave={(v) => { const n = updateExpense(e.id, { amount: v }, "all"); toast.success("Valor atualizado", { description: `${e.description}: ${money(v)}${n > 1 ? ` · ${n} meses` : ""}` }) }} />,
    },
  ], [allMonths, cardOf, updateExpense]) // eslint-disable-line

  function exportCsv(list: Expense[]) {
    downloadCsv([
      ["Mês", "Descrição", "Tipo", "Categoria", "Método", "Cartão", "Parcela", "Valor", "Valor total", "Data da compra", "Essencial", "Status"],
      ...list.map((e) => [monthLabel(e.month), e.description, KIND_LABEL[e.kind], e.category, e.method, cardOf(e.cardId)?.name ?? "",
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
          <p className="text-sm text-muted-foreground">{filtered.length} itens{filtered.length !== rows.length ? " filtrados" : ""}</p>
          <p className="num text-2xl font-semibold tracking-tight">{money(visibleTotal)}</p>
        </div>
      </div>

      <Card className={tableCardClass(true)}>
        <DataTable
          id={allMonths ? "lancamentos-todos" : "lancamentos"}
          key={allMonths ? "all" : "month"}
          rows={rows}
          rowId={(e) => e.id}
          columns={columns}
          label="lançamentos"
          fill
          selectable
          search={(e) => `${e.description} ${e.note ?? ""} ${e.category} ${cardOf(e.cardId)?.name ?? e.method}`}
          searchPlaceholder="Buscar lançamentos…"
          onFilteredChange={setFiltered}
          emptyText="Nenhum lançamento encontrado."
          rowClassName={(e) => (e.status === "cancelled" ? "opacity-55" : undefined)}
          total={{ label: "Total (sem cancelados)", value: (list) => <span className="num font-semibold">{money(list.filter((e) => e.status !== "cancelled").reduce((a, e) => a + e.amount, 0))}</span> }}
          toolbar={(list) => (
            <>
              <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-foreground/[0.04]">
                <Switch checked={allMonths} onCheckedChange={setAllMonths} /> Todos os meses
              </label>
              <Button variant="outline" size="icon-sm" aria-label="Exportar CSV" title="Exportar CSV" onClick={() => exportCsv(list)}><Download /></Button>
              <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setAdding(true)}><Plus /> <span className="hidden sm:inline">Novo gasto</span></Button>
            </>
          )}
          bulkActions={(sel, clear) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "paid"); toast.success("Marcados como pagos") }}><Check /> Pago</Button>
              <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "billed"); toast.success("Marcados como na fatura") }}><CreditCardIcon /> Na fatura</Button>
              <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "pending"); toast.success("Marcados como pendentes") }}><CircleDashed /> Pendente</Button>
              <Button size="sm" variant="secondary" onClick={() => { setStatus(sel, "cancelled"); toast.success("Marcados como cancelados") }}><Ban /> Cancelar</Button>
              {cards.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button size="sm" variant="secondary" />}><CreditCardIcon /> Cartão</DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {cards.map((c) => (
                      <DropdownMenuItem key={c.id} onClick={() => { assignCard(sel, c.id); toast.success(`${sel.length} vinculados a ${c.name}`) }}><CardChip card={c} /></DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { assignCard(sel, undefined); toast.success("Cartão removido dos selecionados") }}>Sem cartão</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button size="sm" variant="destructive" onClick={() => { removeMany(sel); clear(); toast.success(`${sel.length} excluídos`) }}><Trash2 /> Excluir</Button>
            </>
          )}
          rowActions={(e) => (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ações" />}><MoreHorizontal /></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setEditing(e)}><Pencil /> Editar</DropdownMenuItem>
                {e.status !== "paid" && <DropdownMenuItem onClick={() => setStatus([e.id], "paid")}><Check /> Marcar como pago</DropdownMenuItem>}
                {e.status !== "billed" && <DropdownMenuItem onClick={() => setStatus([e.id], "billed")}><CreditCardIcon /> Na fatura do cartão</DropdownMenuItem>}
                {e.status !== "pending" && <DropdownMenuItem onClick={() => setStatus([e.id], "pending")}><CircleDashed /> Marcar como pendente</DropdownMenuItem>}
                {e.status !== "cancelled" && <DropdownMenuItem onClick={() => setStatus([e.id], "cancelled")}><Ban /> Marcar como cancelado</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => { duplicateExpense(e.id); toast.success("Duplicado") }}><Copy /> Duplicar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setRemoving(e)}><Trash2 /> Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      </Card>

      <ExpenseForm open={!!editing} onOpenChange={(o) => !o && setEditing(null)} month={month} expense={editing} />
      <ExpenseForm open={adding} onOpenChange={setAdding} month={month} />

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

export { StatusBadge } from "@/components/status-badge"
