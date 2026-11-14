import { useMemo } from "react"
import { toast } from "sonner"
import { ArrowDownRight, ArrowUpRight, CalendarPlus, CheckCircle2, CircleDashed, PiggyBank, Receipt, ShieldCheck, TrendingUp, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/stat-card"
import { GettingStarted } from "@/components/getting-started"
import { cardStats } from "@/lib/cards"
import { BarList, Donut, Meter, SERIES, TrendChart } from "@/components/charts"
import { carryCandidates, useStore } from "@/lib/store"
import { useSelectedMonth } from "@/lib/use-month"
import { history, installmentsOf, monthSummary, topN } from "@/lib/stats"
import { addMonths, money, monthLabel, percent } from "@/lib/format"
import { KIND_LABEL } from "@/lib/types"

export function Dashboard({ onAdd }: { onAdd: () => void }) {
  const { expenses, months, generateNextMonth, settings } = useStore()
  const cards = settings.cards ?? []
  const month = useSelectedMonth()
  const s = useMemo(() => monthSummary(expenses, months, month), [expenses, months, month])
  const prev = useMemo(() => monthSummary(expenses, months, addMonths(month, -1)), [expenses, months, month])
  const trend = useMemo(() => history(expenses, months).filter((h) => h.month <= month).slice(-12), [expenses, months, month])
  const inst = useMemo(() => installmentsOf(expenses, month), [expenses, month])
  const byCard = useMemo(() => cardStats(expenses, cards, month), [expenses, cards, month])
  const next = addMonths(month, 1)
  const hasNext = expenses.some((e) => e.month === next)
  const toCarry = useMemo(() => carryCandidates(expenses, month).length, [expenses, month])
  const delta = prev.total ? (s.total - prev.total) / prev.total : 0
  const ending = inst.filter((i) => i.remaining === 0)
  const relief = ending.reduce((a, i) => a + i.expense.amount, 0)

  const hasAnyData = expenses.length > 0
  if (!s.list.length && !hasAnyData) return <GettingStarted month={month} onAdd={onAdd} />
  if (!s.list.length)
    return (
      <Card className="mx-auto mt-10 max-w-lg text-center">
        <CardHeader>
          <CardTitle>Nenhum lançamento em {monthLabel(month)}</CardTitle>
          <CardDescription>Adicione um gasto ou copie os fixos e parcelas do mês anterior.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-2">
          <Button onClick={onAdd}><Plus /> Novo gasto</Button>
          {expenses.some((e) => e.month === addMonths(month, -1)) && (
            <Button variant="outline" onClick={() => { const r = generateNextMonth(addMonths(month, -1)); toast.success(`${r.added} itens copiados`) }}>
              <CalendarPlus /> Copiar do mês anterior
            </Button>
          )}
        </CardContent>
      </Card>
    )

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Resumo de</p>
          <h2 className="text-2xl font-semibold tracking-tight">{monthLabel(month)}</h2>
        </div>
        {toCarry > 0 && (
          <Button variant="outline" size="sm" onClick={() => {
            const r = generateNextMonth(month)
            toast.success(`${monthLabel(r.month)} criado`, { description: `${r.added} fixos, assinaturas e parcelas copiados` })
          }}>
            <CalendarPlus /> {hasNext ? "Completar" : "Gerar"} {monthLabel(next)}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total do mês"
          value={money(s.total)}
          icon={Receipt}
          hint={prev.total ? (
            <span className="flex items-center gap-1">
              {delta >= 0 ? <ArrowUpRight className="size-3.5 text-critical" /> : <ArrowDownRight className="size-3.5 text-success" />}
              {percent(Math.abs(delta))} {delta >= 0 ? "acima" : "abaixo"} do mês anterior
            </span>
          ) : `${s.count} lançamentos`}
        />
        <StatCard
          label="Saldo restante"
          value={money(s.balance)}
          icon={PiggyBank}
          tone={s.balance < 0 ? "bad" : "good"}
          hint={`Renda de ${money(s.salary)}`}
        />
        <StatCard label="Comprometimento" value={percent(s.commitment)} icon={TrendingUp} tone={s.commitment > 1 ? "bad" : "default"}
          hint={s.commitment > 1 ? "Orçamento excedido" : s.commitment > 0.9 ? "Atenção: perto do limite" : "Dentro do orçamento"}>
          <Meter value={s.commitment} className="mt-1" />
        </StatCard>
        <StatCard label="Pago" value={money(s.paid)} icon={CheckCircle2}
          hint={<span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-brand" /> {money(s.billed)} na fatura</span>
            <span className="flex items-center gap-1"><CircleDashed className="size-3" /> {money(s.pending)} pendente</span>
          </span>}>
          <div className="mt-1 flex h-2 gap-0.5 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className="h-full bg-success" style={{ width: `${s.total ? (s.paid / s.total) * 100 : 0}%` }} />
            <div className="h-full bg-brand" style={{ width: `${s.total ? (s.billed / s.total) * 100 : 0}%` }} />
          </div>
        </StatCard>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução dos gastos</CardTitle>
            <CardDescription>Últimos {trend.length} meses · fixos vs. variáveis comparados à renda</CardDescription>
          </CardHeader>
          <CardContent><TrendChart data={trend} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Composição</CardTitle>
            <CardDescription>Como o total do mês se divide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Split a={{ label: "Fixos e assinaturas", value: s.fixed, color: SERIES[0] }} b={{ label: "Variáveis e parcelas", value: s.variable, color: SERIES[1] }} />
            <Split a={{ label: "Essenciais", value: s.essential, color: SERIES[2] }} b={{ label: "Não essenciais", value: s.nonEssential, color: SERIES[3] }} icon />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="text-xs text-muted-foreground">Parcelas ativas</div>
                <div className="num text-lg font-semibold">{s.installmentsCount}</div>
                <div className="num text-xs text-muted-foreground">{money(s.installmentsTotal)}/mês</div>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="text-xs text-muted-foreground">Terminam este mês</div>
                <div className="num text-lg font-semibold">{ending.length}</div>
                <div className="num text-xs text-muted-foreground">alívio de {money(relief)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Por categoria</CardTitle>
            <CardDescription>Tipo de despesa</CardDescription>
          </CardHeader>
          <CardContent><Donut data={topN(s.byCategory, 5)} total={s.total} /></CardContent>
        </Card>
        {cards.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Por cartão</CardTitle>
              <CardDescription>Fatura do mês em cada cartão</CardDescription>
              <CardAction><Button variant="ghost" size="sm" nativeButton={false} render={<a href="#/cartoes" />}>Ver cartões</Button></CardAction>
            </CardHeader>
            <CardContent>
              <BarList total={byCard.reduce((a, c) => a + c.month, 0)} data={byCard.filter((c) => c.month > 0).map((c) => ({ name: c.card?.name ?? "Crédito sem cartão", value: c.month, color: c.card?.color ?? "var(--muted-foreground)" }))} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Por método de pagamento</CardTitle>
              <CardDescription>Onde o dinheiro sai</CardDescription>
            </CardHeader>
            <CardContent><BarList data={s.byMethod} total={s.total} /></CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maiores gastos</CardTitle>
            <CardDescription>Top 5 do mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {s.top.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{e.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {KIND_LABEL[e.kind]}{e.kind === "installment" && ` · ${e.installmentCurrent}/${e.installmentTotal}`} · {e.method}
                    </div>
                  </div>
                  <span className="num text-sm font-semibold">{money(e.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Próximas a terminar</CardTitle>
            <CardDescription>Parcelas com menos meses restantes</CardDescription>
            <CardAction><Button variant="ghost" size="sm" nativeButton={false} render={<a href="#/parcelas" />}>Ver todas</Button></CardAction>
          </CardHeader>
          <CardContent>
            {inst.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma parcela neste mês.</p> : (
              <ul className="space-y-3">
                {inst.slice(0, 5).map((i) => (
                  <li key={i.expense.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{i.expense.description}</span>
                      {i.remaining === 0
                        ? <Badge variant="secondary" className="text-success">Última parcela</Badge>
                        : <span className="text-xs text-muted-foreground">termina em {monthLabel(i.endMonth)}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-chart-1" style={{ width: `${i.progress * 100}%` }} />
                      </div>
                      <span className="num w-28 text-right text-xs text-muted-foreground">{i.expense.installmentCurrent}/{i.expense.installmentTotal} · {money(i.expense.amount)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Split({ a, b, icon }: { a: { label: string; value: number; color: string }; b: { label: string; value: number; color: string }; icon?: boolean }) {
  const t = a.value + b.value || 1
  return (
    <div className="space-y-2">
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        <div style={{ width: `${(a.value / t) * 100}%`, background: a.color }} className="rounded-l-full" />
        <div style={{ width: `${(b.value / t) * 100}%`, background: b.color }} className="rounded-r-full" />
      </div>
      {[a, b].map((x) => (
        <div key={x.label} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-[3px]" style={{ background: x.color }} />
          <span className="flex items-center gap-1">{x.label}{icon && x === a && <ShieldCheck className="size-3.5 text-muted-foreground" />}</span>
          <span className="ml-auto text-xs text-muted-foreground">{percent(x.value / t)}</span>
          <span className="num w-24 text-right font-medium">{money(x.value)}</span>
        </div>
      ))}
    </div>
  )
}
