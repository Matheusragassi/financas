import { useMemo } from "react"
import { CalendarCheck, CreditCard, Hourglass, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { GlassTooltip, HoverCursor, Legend, SERIES } from "@/components/charts"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useStore } from "@/lib/store"
import { tableCardClass } from "@/components/table-pager"
import { DataTable } from "@/components/data-table"
import { CardChip } from "@/components/card-visual"
import { useSelectedMonth } from "@/lib/use-month"
import { installmentsOf, projection } from "@/lib/stats"
import { formatDate, money, moneyCompact, monthLabel, monthShort } from "@/lib/format"

const cfg = {
  fixed: { label: "Fixos e assinaturas", color: SERIES[0] },
  installments: { label: "Parcelas", color: SERIES[1] },
} satisfies ChartConfig

export function Installments() {
  const { expenses, months, settings } = useStore()
  const cards = settings.cards ?? []
  const cardName = (id?: string) => cards.find((c) => c.id === id)?.name ?? ""
  const month = useSelectedMonth()
  const list = useMemo(() => installmentsOf(expenses, month), [expenses, month])
  const proj = useMemo(() => projection(expenses, months, month, 12), [expenses, months, month])
  const byCard = (() => {
    const m = new Map<string, { name: string; color: string; owed: number; count: number }>()
    for (const i of list) {
      const c = cards.find((x) => x.id === i.expense.cardId)
      const key = c?.id ?? "none"
      const cur = m.get(key) ?? { name: c?.name ?? "Sem cartão", color: c?.color ?? "var(--muted-foreground)", owed: 0, count: 0 }
      cur.owed += i.remainingValue + i.expense.amount
      cur.count++
      m.set(key, cur)
    }
    return [...m.values()].sort((a, b) => b.owed - a.owed)
  })()
  const monthly = list.reduce((a, i) => a + i.expense.amount, 0)
  const debt = list.reduce((a, i) => a + i.remainingValue, 0)
  const lastEnd = list.reduce((a, i) => (i.endMonth > a ? i.endMonth : a), month)
  const ending = list.filter((i) => i.remaining === 0)

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Compras parceladas em</p>
        <h2 className="text-2xl font-semibold tracking-tight">{monthLabel(month)}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Parcelas no mês" value={money(monthly)} icon={CreditCard} hint={`${list.length} compras ativas`} />
        <StatCard label="Ainda falta pagar" value={money(debt)} icon={Wallet} hint="Após a parcela deste mês" />
        <StatCard label="Terminam este mês" value={String(ending.length)} icon={CalendarCheck} hint={`Libera ${money(ending.reduce((a, i) => a + i.expense.amount, 0))} no próximo mês`} />
        <StatCard label="Livre de parcelas em" value={list.length ? monthLabel(lastEnd) : "—"} icon={Hourglass} hint="Se não houver novas compras" />
      </div>

      {byCard.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byCard.map((c) => (
            <div key={c.name} className="flex items-center gap-3 rounded-2xl bg-card/55 px-4 py-2.5 ring-1 ring-foreground/8 backdrop-blur-xl transition hover:ring-brand/30">
              <span className="h-8 w-1.5 rounded-full" style={{ background: c.color }} />
              <div>
                <div className="text-xs text-muted-foreground">{c.name} · {c.count} {c.count === 1 ? "compra" : "compras"}</div>
                <div className="num text-sm font-semibold">{money(c.owed)} <span className="text-xs font-normal text-muted-foreground">restante</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Previsão dos próximos 12 meses</CardTitle>
          <CardDescription>Fixos atuais + parcelas que continuam. Mostra quando o orçamento alivia.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cfg} className="h-64 w-full">
            <BarChart data={proj} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} strokeDasharray="3 6" strokeOpacity={0.6} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthShort} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => moneyCompact(v)} />
              <ChartTooltip cursor={HoverCursor} content={<GlassTooltip config={cfg} labelFmt={monthLabel} showTotal />} />
              <Bar dataKey="fixed" stackId="a" fill="var(--color-fixed)" stroke="var(--card)" strokeWidth={2} />
              <Bar dataKey="installments" stackId="a" fill="var(--color-installments)" radius={[6, 6, 0, 0]} stroke="var(--card)" strokeWidth={2} />
            </BarChart>
          </ChartContainer>
          <Legend items={[{ label: cfg.fixed.label, color: SERIES[0] }, { label: cfg.installments.label, color: SERIES[1] }]} />
        </CardContent>
      </Card>

      <Card className={tableCardClass()}>
        <DataTable
          id="parcelas"
          rows={list}
          rowId={(i) => i.expense.id}
          label="compras"
          pageSize={10}
          search={(i) => `${i.expense.description} ${i.expense.method} ${cardName(i.expense.cardId)}`}
          searchPlaceholder="Buscar compras…"
          emptyText="Nenhuma compra parcelada neste mês."
          initialSort={{ id: "remaining", dir: 1 }}
          total={{ label: "Total", value: (rows) => <span className="num font-semibold">{money(rows.reduce((a, r) => a + r.remainingValue, 0))}</span> }}
          columns={[
            { id: "name", header: "Compra", fixed: true, className: "min-w-48", sortValue: (i) => i.expense.description,
              cell: (i) => (<div className="min-w-0"><div className="truncate font-medium">{i.expense.description}</div><div className="text-xs text-muted-foreground">termina em {monthLabel(i.endMonth)}</div></div>) },
            { id: "card", header: "Pagamento", filterValue: (i) => cardName(i.expense.cardId) || i.expense.method, sortValue: (i) => cardName(i.expense.cardId) || i.expense.method,
              cell: (i) => { const c = cards.find((x) => x.id === i.expense.cardId); return c ? <CardChip card={c} className="whitespace-nowrap" /> : <span className="whitespace-nowrap text-muted-foreground">{i.expense.method}</span> } },
            { id: "date", header: "Compra em", sortValue: (i) => i.expense.purchaseDate ?? "", cell: (i) => <span className="num whitespace-nowrap text-muted-foreground">{formatDate(i.expense.purchaseDate)}</span> },
            { id: "progress", header: "Progresso", className: "min-w-40", sortValue: (i) => i.progress,
              filterValue: (i) => (i.remaining === 0 ? "Última parcela" : i.remaining <= 2 ? "Quase no fim" : "Em andamento"),
              cell: (i) => (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/[0.06]"><div className="h-full rounded-full bg-chart-1" style={{ width: `${i.progress * 100}%` }} /></div>
                  <span className="num w-11 text-xs text-muted-foreground">{i.expense.installmentCurrent}/{i.expense.installmentTotal}</span>
                </div>) },
            { id: "amount", header: "Parcela", sortValue: (i) => i.expense.amount, cell: (i) => <span className="num">{money(i.expense.amount)}</span> },
            { id: "total", header: "Valor total", defaultHidden: true, sortValue: (i) => i.expense.totalValue ?? 0, cell: (i) => <span className="num text-muted-foreground">{i.expense.totalValue ? money(i.expense.totalValue) : "—"}</span> },
            { id: "remaining", header: "Restante", fixed: true, sortValue: (i) => i.remainingValue,
              cell: (i) => i.remaining === 0
                ? <Badge variant="secondary" className="text-success">Última</Badge>
                : <div><div className="num font-medium">{money(i.remainingValue)}</div><div className="text-xs text-muted-foreground">{i.remaining}x</div></div> },
          ]}
        />
      </Card>
    </div>
  )
}
