import { useMemo, useState } from "react"
import { CalendarRange, Flame, Leaf, Sigma } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { BarList, Donut, SERIES, SimpleBars, TrendChart } from "@/components/charts"
import { useStore } from "@/lib/store"
import { active, average, groupSum, history, topN } from "@/lib/stats"
import { money, monthLabel, percent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { cardTotals } from "@/lib/cards"
import { tableCardClass } from "@/components/table-pager"
import { DataTable } from "@/components/data-table"

export function Reports() {
  const { expenses, months, settings } = useStore()
  const years = useMemo(() => [...new Set(months.map((m) => m.id.slice(0, 4)))].sort(), [months])
  const [year, setYear] = useState("all")
  const inRange = (m: string) => year === "all" || m.startsWith(year)
  const hist = useMemo(() => history(expenses, months).filter((h) => inRange(h.month)), [expenses, months, year]) // eslint-disable-line
  const list = useMemo(() => active(expenses.filter((e) => inRange(e.month))), [expenses, year]) // eslint-disable-line
  const total = list.reduce((a, e) => a + e.amount, 0)
  const income = hist.reduce((a, h) => a + h.salary, 0)
  const withData = hist.filter((h) => h.total > 0)
  const avg = average(withData.map((h) => h.total))
  const max = withData.reduce((a, h) => (h.total > (a?.total ?? -1) ? h : a), withData[0])
  const min = withData.reduce((a, h) => (h.total < (a?.total ?? Infinity) ? h : a), withData[0])
  const byCat = groupSum(list, (e) => e.category)
  const byMethod = groupSum(list, (e) => e.method)
  const byItem = groupSum(list, (e) => e.description.trim()).slice(0, 10)
  const subs = groupSum(list.filter((e) => e.kind === "subscription" || e.method === "Assinatura"), (e) => e.description.trim())
  const byCard = cardTotals(expenses, settings.cards ?? [], inRange)
  const histDesc = useMemo(() => [...hist].reverse(), [hist])
  const overBudget = withData.filter((h) => h.commitment > 1).length

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Estatísticas</p>
          <h2 className="text-2xl font-semibold tracking-tight">{year === "all" ? "Todo o período" : year}</h2>
        </div>
        <Tabs value={year} onValueChange={(v) => setYear(String(v))}>
          <TabsList>
            <TabsTrigger value="all">Tudo</TabsTrigger>
            {years.map((y) => <TabsTrigger key={y} value={y}>{y}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="Total gasto" value={money(total)} icon={Sigma} hint={`${percent(income ? total / income : 0)} da renda no período`} />
        <StatCard label="Média mensal" value={money(avg)} icon={CalendarRange} hint={`${withData.length} meses com lançamentos`} />
        <StatCard label="Mês mais caro" value={max ? money(max.total) : "—"} icon={Flame} hint={max ? monthLabel(max.month) : ""} />
        <StatCard label="Mês mais leve" value={min ? money(min.total) : "—"} icon={Leaf} hint={`${overBudget} meses acima da renda`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos x renda por mês</CardTitle>
          <CardDescription>Barras empilhadas mostram fixos e variáveis; a linha tracejada é a renda.</CardDescription>
        </CardHeader>
        <CardContent><TrendChart data={hist} height={300} /></CardContent>
      </Card>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Saldo mensal</CardTitle><CardDescription>Renda menos gastos · verde sobrou, vermelho faltou</CardDescription></CardHeader>
          <CardContent><SimpleBars data={hist} dataKey="balance" label="Saldo" signed /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Por categoria</CardTitle><CardDescription>No período selecionado</CardDescription></CardHeader>
          <CardContent><Donut data={topN(byCat, 5)} total={total} /></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Onde mais gastei</CardTitle><CardDescription>Top 10 itens somados no período</CardDescription></CardHeader>
          <CardContent><BarList data={byItem} total={total} max={10} /></CardContent>
        </Card>
        <Card>
          {byCard.length > 0 ? (
            <>
              <CardHeader><CardTitle>Por cartão</CardTitle><CardDescription>Quanto passou em cada cartão no período</CardDescription></CardHeader>
              <CardContent><BarList data={byCard} total={total} /></CardContent>
            </>
          ) : (
            <>
              <CardHeader><CardTitle>Métodos de pagamento</CardTitle><CardDescription>Participação no total</CardDescription></CardHeader>
              <CardContent><BarList data={byMethod} total={total} color={SERIES[1]} /></CardContent>
            </>
          )}
        </Card>
        <Card>
          <CardHeader><CardTitle>Assinaturas</CardTitle><CardDescription>Quanto cada uma custou no período</CardDescription></CardHeader>
          <CardContent>{subs.length ? <BarList data={subs} total={total} color={SERIES[6]} max={10} /> : <p className="text-sm text-muted-foreground">Nenhuma assinatura.</p>}</CardContent>
        </Card>
      </div>

      <Card className={tableCardClass()}>
        <CardHeader className="border-b border-foreground/8 py-4"><CardTitle>Tabela mensal</CardTitle></CardHeader>
        <DataTable
          id="relatorio-mensal"
          rows={histDesc}
          rowId={(h) => h.month}
          label="meses"
          pageSize={10}
          search={(h) => monthLabel(h.month)}
          searchPlaceholder="Buscar mês…"
          emptyText="Sem meses no período."
          total={{ label: "Total do período", columnId: "total", value: (rows) => <span className="num font-semibold">{money(rows.reduce((a, r) => a + r.total, 0))}</span> }}
          columns={[
            { id: "month", header: "Mês", fixed: true, sortValue: (h) => h.month, filterValue: (h) => h.month.slice(0, 4), cell: (h) => <span className="font-medium whitespace-nowrap">{monthLabel(h.month)}</span> },
            { id: "salary", header: "Renda", align: "right", sortValue: (h) => h.salary, cell: (h) => <span className="num text-muted-foreground">{money(h.salary)}</span> },
            { id: "total", header: "Gastos", align: "right", sortValue: (h) => h.total, cell: (h) => <span className="num">{money(h.total)}</span> },
            { id: "fixed", header: "Fixos", align: "right", sortValue: (h) => h.fixed, cell: (h) => <span className="num text-muted-foreground">{money(h.fixed)}</span> },
            { id: "variable", header: "Variáveis", align: "right", sortValue: (h) => h.variable, cell: (h) => <span className="num text-muted-foreground">{money(h.variable)}</span> },
            { id: "commitment", header: "Comprometido", align: "right", sortValue: (h) => h.commitment,
              filterValue: (h) => (h.commitment > 1 ? "Acima da renda" : h.commitment > 0.9 ? "No limite" : "Dentro da renda"),
              cell: (h) => <span className={cn("num", h.commitment > 1 && "text-critical")}>{percent(h.commitment)}</span> },
            { id: "balance", header: "Saldo", align: "right", sortValue: (h) => h.balance, cell: (h) => <span className={cn("num font-medium", h.balance < 0 ? "text-critical" : "text-success")}>{money(h.balance)}</span> },
          ]}
        />
      </Card>
    </div>
  )
}
