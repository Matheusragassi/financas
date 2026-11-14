import { addMonths, monthDiff } from "./format"
import type { Expense, Month } from "./types"

export const active = (list: Expense[]) => list.filter((e) => e.status !== "cancelled")
const sum = (list: Expense[]) => list.reduce((a, e) => a + (e.amount || 0), 0)

export function groupSum(list: Expense[], key: (e: Expense) => string) {
  const map = new Map<string, number>()
  for (const e of list) map.set(key(e), (map.get(key(e)) ?? 0) + e.amount)
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** Mantém as N maiores fatias e junta o resto em "Outros" */
export function topN(rows: { name: string; value: number }[], n: number) {
  if (rows.length <= n) return rows
  const head = rows.slice(0, n - 1)
  const rest = rows.slice(n - 1).reduce((a, r) => a + r.value, 0)
  return [...head, { name: "Outros", value: rest }]
}

export function monthSummary(all: Expense[], months: Month[], monthId: string) {
  const list = all.filter((e) => e.month === monthId)
  const act = active(list)
  const salary = months.find((m) => m.id === monthId)?.salary ?? 0
  const total = sum(act)
  const fixed = sum(act.filter((e) => e.kind === "fixed" || e.kind === "subscription"))
  const installments = act.filter((e) => e.kind === "installment")
  return {
    list,
    salary,
    total,
    paid: sum(act.filter((e) => e.status === "paid")),
    pending: sum(act.filter((e) => e.status === "pending")),
    cancelled: sum(list.filter((e) => e.status === "cancelled")),
    balance: salary - total,
    commitment: salary ? total / salary : 0,
    essential: sum(act.filter((e) => e.essential)),
    nonEssential: sum(act.filter((e) => !e.essential)),
    fixed,
    variable: total - fixed,
    installmentsTotal: sum(installments),
    installmentsCount: installments.length,
    endingCount: installments.filter((e) => e.installmentCurrent === e.installmentTotal).length,
    count: act.length,
    byCategory: groupSum(act, (e) => e.category || "Outros"),
    byMethod: groupSum(act, (e) => e.method || "Outros"),
    top: [...act].sort((a, b) => b.amount - a.amount).slice(0, 5),
  }
}
export type MonthSummary = ReturnType<typeof monthSummary>

export function history(all: Expense[], months: Month[]) {
  return months.map((m) => {
    const s = monthSummary(all, months, m.id)
    return {
      month: m.id,
      salary: s.salary,
      total: s.total,
      fixed: s.fixed,
      variable: s.variable,
      essential: s.essential,
      nonEssential: s.nonEssential,
      balance: s.balance,
      commitment: s.commitment,
    }
  })
}

export interface InstallmentInfo {
  expense: Expense
  remaining: number
  remainingValue: number
  endMonth: string
  progress: number
}

export function installmentsOf(all: Expense[], monthId: string): InstallmentInfo[] {
  return active(all.filter((e) => e.month === monthId && e.kind === "installment"))
    .map((e) => {
      const total = e.installmentTotal ?? 1
      const cur = e.installmentCurrent ?? 1
      const remaining = Math.max(0, total - cur)
      return {
        expense: e,
        remaining,
        remainingValue: remaining * e.amount,
        endMonth: addMonths(monthId, remaining),
        progress: cur / total,
      }
    })
    .sort((a, b) => a.remaining - b.remaining)
}

/** Projeção dos próximos meses: fixos/assinaturas repetem e parcelas vão terminando */
export function projection(all: Expense[], months: Month[], from: string, n = 12) {
  const base = active(all.filter((e) => e.month === from))
  const fixed = sum(base.filter((e) => e.kind === "fixed" || e.kind === "subscription"))
  const inst = installmentsOf(all, from)
  const salary = months.find((m) => m.id === from)?.salary ?? 0
  return Array.from({ length: n }, (_, i) => {
    const month = addMonths(from, i + 1)
    const parcelas = inst.filter((x) => monthDiff(from, x.endMonth) >= i + 1).reduce((a, x) => a + x.expense.amount, 0)
    return { month, fixed, installments: parcelas, total: fixed + parcelas, salary }
  })
}

export function average(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}
