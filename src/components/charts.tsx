import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, Sector, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { money, moneyCompact, monthShort, monthLabel, percent } from "@/lib/format"
import { cn } from "@/lib/utils"

export const SERIES = Array.from({ length: 8 }, (_, i) => `var(--chart-${i + 1})`)

interface TipItem { name?: string | number; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }

/** Tooltip em vidro: cor de cada série, valores e total */
export function GlassTooltip({ active, payload, label, config, labelFmt, showTotal }: {
  active?: boolean; payload?: TipItem[]; label?: string | number; config: ChartConfig; labelFmt?: (l: string) => string; showTotal?: boolean
}) {
  if (!active || !payload?.length) return null
  const items = payload.filter((p) => p.value != null)
  const sumKeys = items.filter((p) => p.dataKey !== "salary")
  const total = sumKeys.reduce((a, p) => a + Number(p.value), 0)
  return (
    <div className="min-w-48 overflow-hidden rounded-xl bg-popover/80 text-xs shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] ring-1 ring-foreground/10 backdrop-blur-xl backdrop-saturate-150 animate-in fade-in-0 zoom-in-95 duration-150">
      {label != null && <div className="border-b border-foreground/8 px-3 py-2 font-medium">{labelFmt ? labelFmt(String(label)) : label}</div>}
      <div className="grid gap-1.5 px-3 py-2">
        {items.map((p) => {
          const key = String(p.dataKey ?? p.name)
          const color = p.color ?? (p.payload?.fill as string)
          return (
            <div key={key + String(p.name)} className="flex items-center gap-2">
              <span className="h-3 w-1 shrink-0 rounded-full" style={{ background: color }} />
              <span className="text-muted-foreground">{(config[key]?.label as string) ?? p.name}</span>
              <span className="num ml-auto pl-3 font-semibold text-foreground">{money(Number(p.value))}</span>
            </div>
          )
        })}
      </div>
      {showTotal && sumKeys.length > 1 && (
        <div className="flex items-center justify-between border-t border-foreground/8 bg-foreground/[0.03] px-3 py-2">
          <span className="text-muted-foreground">Total</span>
          <span className="num font-semibold">{money(total)}</span>
        </div>
      )}
    </div>
  )
}

/** Faixa de destaque atrás da coluna sob o mouse */
export const HoverCursor = { fill: "var(--brand)", fillOpacity: 0.08, radius: 8 }

export interface TrendRow { month: string; fixed: number; variable: number; salary: number; total: number }

const trendConfig = {
  fixed: { label: "Fixos e assinaturas", color: SERIES[0] },
  variable: { label: "Variáveis e parcelas", color: SERIES[1] },
  salary: { label: "Renda", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export function TrendChart({ data, height = 280 }: { data: TrendRow[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const dim = (i: number) => (hover == null || hover === i ? 1 : 0.35)
  return (
    <div>
      <ChartContainer config={trendConfig} className="w-full" style={{ height }}>
        <ComposedChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="24%"
          onMouseMove={(s) => setHover(typeof s?.activeTooltipIndex === "number" ? s.activeTooltipIndex : s?.activeTooltipIndex != null ? Number(s.activeTooltipIndex) : null)}
          onMouseLeave={() => setHover(null)}>
          <CartesianGrid vertical={false} strokeDasharray="3 6" strokeOpacity={0.6} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={monthShort} minTickGap={8} />
          <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => moneyCompact(v)} />
          <ChartTooltip cursor={HoverCursor} content={<GlassTooltip config={trendConfig} labelFmt={monthLabel} showTotal />} />
          <Bar dataKey="fixed" stackId="a" fill="var(--color-fixed)" stroke="var(--card)" strokeWidth={2} animationDuration={600}>
            {data.map((_, i) => <Cell key={i} fillOpacity={dim(i)} style={{ transition: "fill-opacity 200ms" }} />)}
          </Bar>
          <Bar dataKey="variable" stackId="a" fill="var(--color-variable)" radius={[6, 6, 0, 0]} stroke="var(--card)" strokeWidth={2} animationDuration={600}>
            {data.map((_, i) => <Cell key={i} fillOpacity={dim(i)} style={{ transition: "fill-opacity 200ms" }} />)}
          </Bar>
          <Line dataKey="salary" type="stepAfter" stroke="var(--color-salary)" strokeWidth={2} strokeDasharray="5 4" dot={false}
            activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)", fill: "var(--muted-foreground)" }} />
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
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
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

/** Rosca interativa: fatia sob o mouse cresce; centro mostra nome e valor */
export function Donut({ data, total }: { data: { name: string; value: number }[]; total: number }) {
  const [active, setActive] = useState<number | null>(null)
  const config = Object.fromEntries(data.map((d, i) => [d.name, { label: d.name, color: SERIES[i] }])) as ChartConfig
  const cur = active != null ? data[active] : null
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto size-48">
        <ChartContainer config={config} className="size-full">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} strokeWidth={3} stroke="var(--card)" paddingAngle={1.5} cornerRadius={4}
              animationDuration={700}
              shape={(props, index) => <Sector {...props} outerRadius={(props.outerRadius ?? 86) + (index === active ? 7 : 0)} style={{ transition: "all 200ms" }} />}
              onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
              {data.map((d, i) => <Cell key={d.name} fill={SERIES[i]} fillOpacity={active == null || active === i ? 1 : 0.35} style={{ transition: "fill-opacity 200ms", cursor: "pointer" }} />)}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-24 truncate text-[11px] text-muted-foreground">{cur ? cur.name : "Total"}</span>
          <span className="num text-base font-semibold">{moneyCompact(cur ? cur.value : total)}</span>
          {cur && <span className="text-[11px] text-muted-foreground">{percent(total ? cur.value / total : 0)}</span>}
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {data.map((d, i) => (
          <li key={d.name} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            className={cn("flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 transition-colors", active === i && "bg-foreground/[0.05]")}>
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

/** Barras horizontais em HTML: legíveis, com rótulo, valor e hover */
export function BarList({ data, total, color = SERIES[0], max = 8 }: { data: { name: string; value: number; color?: string }[]; total: number; color?: string; max?: number }) {
  const top = data.slice(0, max)
  const peak = Math.max(...top.map((d) => d.value), 1)
  return (
    <ul className="-mx-2 space-y-1">
      {top.map((d) => (
        <li key={d.name} className="group/bar space-y-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-foreground/[0.04]">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5">{d.color && <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />}<span className="truncate">{d.name}</span></span>
            <span className="num shrink-0 font-medium">
              {money(d.value)} <span className="text-xs font-normal text-muted-foreground">· {percent(total ? d.value / total : 0)}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div className="h-full origin-left rounded-full transition-[filter,transform] duration-300 group-hover/bar:brightness-125"
              style={{ width: `${(d.value / peak) * 100}%`, background: d.color ?? color, boxShadow: `0 0 12px -2px ${d.color ?? color}` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SimpleBars({ data, dataKey, label, color = SERIES[0], height = 220, xKey = "month", xFmt = monthShort, signed }: {
  data: Record<string, unknown>[]; dataKey: string; label: string; color?: string; height?: number; xKey?: string; xFmt?: (v: string) => string; signed?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const config = { [dataKey]: { label, color } } satisfies ChartConfig
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }} barCategoryGap="24%"
        onMouseMove={(s) => setHover(s?.activeTooltipIndex != null ? Number(s.activeTooltipIndex) : null)} onMouseLeave={() => setHover(null)}>
        <CartesianGrid vertical={false} strokeDasharray="3 6" strokeOpacity={0.6} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={10} tickFormatter={xFmt} minTickGap={8} />
        <YAxis tickLine={false} axisLine={false} width={64} tickFormatter={(v) => moneyCompact(v)} />
        <ChartTooltip cursor={HoverCursor} content={<GlassTooltip config={config} labelFmt={xKey === "month" ? monthLabel : undefined} />} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 6, 6]} animationDuration={600}>
          {data.map((d, i) => (
            <Cell key={i} fill={signed ? (Number(d[dataKey]) < 0 ? "var(--critical)" : "var(--success)") : color}
              fillOpacity={hover == null || hover === i ? 1 : 0.35} style={{ transition: "fill-opacity 200ms" }} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export function Meter({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, value)
  const tone = v > 1 ? "bg-critical" : v > 0.9 ? "bg-warning" : "bg-success"
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-foreground/[0.06]", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${Math.min(100, v * 100)}%` }} />
    </div>
  )
}
