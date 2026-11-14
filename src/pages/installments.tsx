import { useMemo } from "react"
import { CalendarCheck, CreditCard, Hourglass, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatCard } from "@/components/stat-card"
import { Legend, SERIES } from "@/components/charts"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useStore } from "@/lib/store"
import { useSelectedMonth } from "@/lib/use-month"
import { installmentsOf, projection } from "@/lib/stats"
import { formatDate, money, moneyCompact, monthLabel, monthShort } from "@/lib/format"

const cfg = {
  fixed: { label: "Fixos e assinaturas", color: SERIES[0] },
  installments: { label: "Parcelas", color: SERIES[1] },
} satisfies ChartConfig

export function Installments() {
  const { expenses, months } = useStore()
  const month = useSelectedMonth()
  const list = useMemo(() => installmentsOf(expenses, month), [expenses, month])
  const proj = useMemo(() => projection(expenses, months, month, 12), [expenses, months, month])
  const monthly = list.reduce((a, i) => a + i.expense.amount, 0)
  const debt = list.reduce((a, i) => a + i.remainingValue, 0)
  const lastEnd = list.reduce((a, i) => (i.endMonth > a ? i.endMonth : a), month)
  const ending = list.filter((i) => i.remaining === 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Compras parceladas em</p>
        <h2 className="text-2xl font-semibold tracking-tight">{monthLabel(month)}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Parcelas no mês" value={money(monthly)} icon={CreditCard} hint={`${list.length} compras ativas`} />
        <StatCard label="Ainda falta pagar" value={money(debt)} icon={Wallet} hint="Após a parcela deste mês" />
        <StatCard label="Terminam este mês" value={String(ending.length)} icon={CalendarCheck} hint={`Libera ${money(ending.reduce((a, i) => a + i.expense.amount, 0))} no próximo mês`} />
        <StatCard label="Livre de parcelas em" value={list.length ? monthLabel(lastEnd) : "—"} icon={Hourglass} hint="Se não houver novas compras" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previsão dos próximos 12 meses</CardTitle>
          <CardDescription>Fixos atuais + parcelas que continuam. Mostra quando o orçamento alivia.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={cfg} className="h-64 w-full">
            <BarChart data={proj} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthShort} />
              <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => moneyCompact(v)} />
              <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={({ active, payload, label }) => active && payload?.length ? (
                <div className="grid min-w-44 gap-1 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="font-medium">{monthLabel(String(label))}</div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
                      <span className="text-muted-foreground">{cfg[p.dataKey as keyof typeof cfg].label}</span>
                      <span className="num ml-auto font-medium">{money(Number(p.value))}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t pt-1"><span>Total</span><span className="num font-medium">{money(Number(payload[0].payload.total))}</span></div>
                </div>
              ) : null} />
              <Bar dataKey="fixed" stackId="a" fill="var(--color-fixed)" stroke="var(--card)" strokeWidth={2} />
              <Bar dataKey="installments" stackId="a" fill="var(--color-installments)" radius={[4, 4, 0, 0]} stroke="var(--card)" strokeWidth={2} />
            </BarChart>
          </ChartContainer>
          <Legend items={[{ label: cfg.fixed.label, color: SERIES[0] }, { label: cfg.installments.label, color: SERIES[1] }]} />
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Compra</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Parcela</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Valor total</TableHead>
              <TableHead className="pr-4 text-right">Restante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">Nenhuma compra parcelada neste mês.</TableCell></TableRow>}
            {list.map((i) => (
              <TableRow key={i.expense.id}>
                <TableCell className="max-w-[12rem] pl-4">
                  <div className="truncate font-medium">{i.expense.description}</div>
                  <div className="text-xs text-muted-foreground">{i.expense.method} · termina {monthLabel(i.endMonth)}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(i.expense.purchaseDate)}</TableCell>
                <TableCell className="min-w-36">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-chart-1" style={{ width: `${i.progress * 100}%` }} />
                    </div>
                    <span className="num w-12 text-xs text-muted-foreground">{i.expense.installmentCurrent}/{i.expense.installmentTotal}</span>
                  </div>
                </TableCell>
                <TableCell className="num hidden sm:table-cell text-right">{money(i.expense.amount)}</TableCell>
                <TableCell className="num hidden lg:table-cell text-right text-muted-foreground">{i.expense.totalValue ? money(i.expense.totalValue) : "—"}</TableCell>
                <TableCell className="pr-4 text-right">
                  {i.remaining === 0
                    ? <Badge variant="secondary" className="text-success">Última</Badge>
                    : <div><div className="num font-medium">{money(i.remainingValue)}</div><div className="text-xs text-muted-foreground">{i.remaining}x</div></div>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
