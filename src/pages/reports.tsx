import { useMemo, useState } from "react"
import { CalendarRange, Flame, Leaf, Sigma } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { BarList, Donut, SERIES, SimpleBars, TrendChart } from "@/components/charts"
import { useStore } from "@/lib/store"
import { active, average, groupSum, history, topN } from "@/lib/stats"
import { money, monthLabel, percent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { cardTotals } from "@/lib/cards"

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

      <Card className="py-0">
        <CardHeader className="pt-4"><CardTitle>Tabela mensal</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Mês</TableHead>
              <TableHead className="text-right">Renda</TableHead>
              <TableHead className="text-right">Gastos</TableHead>
              <TableHead className="hidden md:table-cell text-right">Fixos</TableHead>
              <TableHead className="hidden md:table-cell text-right">Variáveis</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Comprometido</TableHead>
              <TableHead className="pr-4 text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...hist].reverse().map((h) => (
              <TableRow key={h.month}>
                <TableCell className="pl-4 font-medium">{monthLabel(h.month)}</TableCell>
                <TableCell className="num text-right text-muted-foreground">{money(h.salary)}</TableCell>
                <TableCell className="num text-right">{money(h.total)}</TableCell>
                <TableCell className="num hidden md:table-cell text-right text-muted-foreground">{money(h.fixed)}</TableCell>
                <TableCell className="num hidden md:table-cell text-right text-muted-foreground">{money(h.variable)}</TableCell>
                <TableCell className={cn("num hidden sm:table-cell text-right", h.commitment > 1 && "text-critical")}>{percent(h.commitment)}</TableCell>
                <TableCell className={cn("num pr-4 text-right font-medium", h.balance < 0 ? "text-critical" : "text-success")}>{money(h.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
