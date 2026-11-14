import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { money, moneyCompact, monthShort, monthLabel, percent } from "@/lib/format"
import { cn } from "@/lib/utils"

export const SERIES = Array.from({ length: 8 }, (_, i) => `var(--chart-${i + 1})`)

interface TipItem { name?: string | number; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }

function MoneyTooltip({ active, payload, label, config, labelFmt }: {
  active?: boolean; payload?: TipItem[]; label?: string | number; config: ChartConfig; labelFmt?: (l: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="grid min-w-40 gap-1.5 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-xl">
      {label != null && <div className="font-medium">{labelFmt ? labelFmt(String(label)) : label}</div>}
      {payload.map((p) => {
        const key = String(p.dataKey ?? p.name)
        const color = p.color ?? (p.payload?.fill as string)
        return (
          <div key={key + String(p.name)} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
            <span className="text-muted-foreground">{(config[key]?.label as string) ?? p.name}</span>
            <span className="num ml-auto font-medium text-foreground">{money(Number(p.value))}</span>
          </div>
        )
      })}
    </div>
  )
}

export interface TrendRow { month: string; fixed: number; variable: number; salary: number; total: number }

const trendConfig = {
  fixed: { label: "Fixos e assinaturas", color: SERIES[0] },
  variable: { label: "Variáveis e parcelas", color: SERIES[1] },
  salary: { label: "Renda", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export function TrendChart({ data, height = 280 }: { data: TrendRow[]; height?: number }) {
  return (
    <div>
      <ChartContainer config={trendConfig} className="w-full" style={{ height }}>
        <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} strokeDasharray="0" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthShort} minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => moneyCompact(v)} />
          <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<MoneyTooltip config={trendConfig} labelFmt={monthLabel} />} />
          <Bar dataKey="fixed" stackId="a" fill="var(--color-fixed)" stroke="var(--card)" strokeWidth={2} />
          <Bar dataKey="variable" stackId="a" fill="var(--color-variable)" radius={[4, 4, 0, 0]} stroke="var(--card)" strokeWidth={2} />
          <Line dataKey="salary" type="stepAfter" stroke="var(--color-salary)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </ComposedChart>
      </ChartContainer>
      <Legend items={[
        { label: trendConfig.fixed.label, color: SERIES[0] },
        { label: trendConfig.variable.label, color: SERIES[1] },
        { label: "Renda", color: "var(--muted-foreground)", dashed: true },
      ]} />
    </div>
  )
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          {i.dashed
            ? <span className="h-0 w-3.5 border-t-2 border-dashed" style={{ borderColor: i.color }} />
            : <span className="size-2.5 rounded-[3px]" style={{ background: i.color }} />}
          {i.label}
        </span>
      ))}
    </div>
  )
}

export function Donut({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  const config = Object.fromEntries(data.map((d, i) => [d.name, { label: d.name, color: SERIES[i] }])) as ChartConfig
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
      <ChartContainer config={config} className="mx-auto aspect-square w-44">
        <PieChart>
          <ChartTooltip content={<MoneyTooltip config={config} />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} strokeWidth={2} stroke="var(--card)" paddingAngle={1}>
            {data.map((d, i) => <Cell key={d.name} fill={SERIES[i]} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: SERIES[i] }} />
            <span className="truncate">{d.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">{percent(total ? d.value / total : 0)}</span>
            <span className="num w-24 text-right font-medium">{money(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Barras horizontais em HTML: legíveis, com rótulo e valor */
export function BarList({ data, total, color = SERIES[0], max = 8 }: { data: { name: string; value: number }[]; total: number; color?: string; max?: number }) {
  const top = data.slice(0, max)
  const peak = Math.max(...top.map((d) => d.value), 1)
  return (
    <ul className="space-y-2.5">
      {top.map((d) => (
        <li key={d.name} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{d.name}</span>
            <span className="num shrink-0 font-medium">
              {money(d.value)} <span className="text-xs font-normal text-muted-foreground">· {percent(total ? d.value / total : 0)}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(d.value / peak) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SimpleBars({ data, dataKey, label, color = SERIES[0], height = 220, xKey = "month", xFmt = monthShort, signed }: {
  data: Record<string, unknown>[]; dataKey: string; label: string; color?: string; height?: number; xKey?: string; xFmt?: (v: string) => string; signed?: boolean
}) {
  const config = { [dataKey]: { label, color } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={xFmt} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => moneyCompact(v)} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<MoneyTooltip config={config} labelFmt={xKey === "month" ? monthLabel : undefined} />} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]}>
          {signed && data.map((d, i) => <Cell key={i} fill={Number(d[dataKey]) < 0 ? "var(--critical)" : "var(--success)"} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export function Meter({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, value)
  const tone = v > 1 ? "bg-critical" : v > 0.9 ? "bg-warning" : "bg-success"
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.min(100, v * 100)}%` }} />
    </div>
  )
}
