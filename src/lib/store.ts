import { create } from "zustand"
import { persist } from "zustand/middleware"
import { addMonths, uid } from "./format"
import { currencyOf } from "./currency"
import { openStatus } from "./status"
import type { Backup, CreditCard, Expense, ExpenseStatus, Month, Settings } from "./types"

export const DEFAULT_SETTINGS: Settings = {
  ownerName: "",
  defaultSalary: 0,
  categories: ["Serviço", "Produto", "Assinatura", "Seguro", "Cofrinho", "Presentes", "Alimentação", "Transporte", "Saúde", "Lazer", "Extras"],
  methods: ["Cartão de C.", "Pagamento à P.", "Assinatura", "PIX", "Débito", "Dinheiro", "Outros"],
  budgetAlert: 0.9,
}

export type NewExpense = Omit<Expense, "id">
export type Scope = "this" | "future" | "all"

interface State {
  initialized: boolean
  isDemo: boolean
  settings: Settings
  months: Month[]
  expenses: Expense[]
  selectedMonth: string | null
  setSelectedMonth: (m: string) => void
  importBackup: (b: Backup, opts?: { demo?: boolean }) => void
  exportBackup: () => Backup
  resetAll: () => void
  startEmpty: (salary: number, name: string, month: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  ensureMonth: (id: string) => void
  setSalary: (month: string, salary: number) => void
  deleteMonth: (month: string) => void
  addExpense: (e: NewExpense, opts?: { spread?: boolean; repeat?: number }) => number
  updateExpense: (id: string, patch: Partial<Expense>, scope?: Scope) => number
  removeExpense: (id: string, scope?: Scope) => number
  setStatus: (ids: string[], status: ExpenseStatus) => void
  removeMany: (ids: string[]) => void
  duplicateExpense: (id: string) => void
  generateNextMonth: (from: string) => { month: string; added: number }
  saveCard: (card: Omit<CreditCard, "id"> & { id?: string }) => string
  removeCard: (id: string) => void
  /** Vincula lançamentos a um cartão; retorna quantos */
  assignCard: (ids: string[], cardId: string | undefined) => number
  /** Troca a moeda; com `rate`, converte todos os valores (lançamentos, rendas e limites) */
  changeCurrency: (code: string, rate?: number) => void
  /** Marca como pagos os lançamentos "na fatura" de um cartão num mês */
  payInvoice: (month: string, cardId: string | null) => number
}

/** Itens do mês que ainda não foram levados para o mês seguinte */
export function carryCandidates(expenses: Expense[], from: string) {
  const next = addMonths(from, 1)
  const existing = expenses.filter((e) => e.month === next)
  return expenses.filter((e) => {
    if (e.month !== from || e.status === "cancelled") return false
    if (existing.some((x) => sameGroup(x, e))) return false
    if (e.kind === "fixed" || e.kind === "subscription") return true
    if (e.kind === "installment") return (e.installmentCurrent ?? 0) < (e.installmentTotal ?? 0)
    return false
  })
}

const sortMonths = (ms: Month[]) => [...ms].sort((a, b) => a.id.localeCompare(b.id))

function withMonths(months: Month[], ids: string[], salary: number): Month[] {
  const have = new Set(months.map((m) => m.id))
  const extra = [...new Set(ids)].filter((id) => !have.has(id)).map((id) => {
    const prev = sortMonths(months).filter((m) => m.id < id).pop()
    return { id, salary: prev?.salary ?? salary }
  })
  return extra.length ? sortMonths([...months, ...extra]) : months
}

/** Mesma compra/assinatura em outros meses */
function sameGroup(a: Expense, b: Expense) {
  if (a.groupId && b.groupId) return a.groupId === b.groupId
  return a.description.trim().toLowerCase() === b.description.trim().toLowerCase() && a.kind === b.kind
}

function inScope(base: Expense, e: Expense, scope: Scope) {
  if (e.id === base.id) return true
  if (scope === "this" || !sameGroup(base, e)) return false
  return scope === "all" || e.month > base.month
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      initialized: false,
      isDemo: false,
      settings: DEFAULT_SETTINGS,
      months: [],
      expenses: [],
      selectedMonth: null,
      setSelectedMonth: (m) => set({ selectedMonth: m }),

      importBackup: (b, opts) =>
        set({
          ...{},
          initialized: true,
          isDemo: !!opts?.demo,
          settings: { ...DEFAULT_SETTINGS, ...b.settings },
          months: sortMonths(b.months),
          expenses: b.expenses.map((e) => ({ ...e, id: e.id || uid(), status: e.status === "pending" ? openStatus(e.method) : e.status })),
          selectedMonth: null,
        }),
      exportBackup: () => {
        const { settings, months, expenses } = get()
        return { app: "financas", version: 1, exportedAt: new Date().toISOString(), settings, months, expenses }
      },
      resetAll: () => set({ initialized: false, isDemo: false, settings: DEFAULT_SETTINGS, months: [], expenses: [], selectedMonth: null }),
      startEmpty: (salary, name, month) =>
        set({
          initialized: true,
          isDemo: false,
          settings: { ...DEFAULT_SETTINGS, defaultSalary: salary, ownerName: name },
          months: [{ id: month, salary }],
          expenses: [],
          selectedMonth: month,
        }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      ensureMonth: (id) => set((s) => ({ months: withMonths(s.months, [id], s.settings.defaultSalary) })),
      setSalary: (month, salary) =>
        set((s) => ({
          months: withMonths(s.months, [month], salary).map((m) => (m.id === month ? { ...m, salary } : m)),
        })),
      deleteMonth: (month) =>
        set((s) => ({
          months: s.months.filter((m) => m.id !== month),
          expenses: s.expenses.filter((e) => e.month !== month),
          selectedMonth: null,
        })),

      addExpense: (e, opts) => {
        const items: Expense[] = []
        const groupId = uid()
        if (e.kind === "installment" && opts?.spread && e.installmentTotal && e.installmentCurrent) {
          for (let i = e.installmentCurrent; i <= e.installmentTotal; i++) {
            const k = i - e.installmentCurrent
            items.push({
              ...e,
              id: uid(),
              groupId,
              month: addMonths(e.month, k),
              installmentCurrent: i,
              lastInstallment: i === e.installmentTotal,
              status: k === 0 ? e.status : openStatus(e.method),
            })
          }
        } else {
          const n = Math.max(1, opts?.repeat ?? 1)
          for (let k = 0; k < n; k++)
            items.push({ ...e, id: uid(), groupId, month: addMonths(e.month, k), status: k === 0 ? e.status : openStatus(e.method) })
        }
        set((s) => ({
          expenses: [...s.expenses, ...items],
          months: withMonths(s.months, items.map((i) => i.month), s.settings.defaultSalary),
        }))
        return items.length
      },

      updateExpense: (id, patch, scope = "this") => {
        const base = get().expenses.find((e) => e.id === id)
        if (!base) return 0
        let n = 0
        // Campos que fazem sentido propagar entre meses
        const { month: _m, installmentCurrent: _ic, status: _st, lastInstallment: _li, ...shared } = patch
        void _m; void _ic; void _st; void _li
        set((s) => ({
          expenses: s.expenses.map((e) => {
            if (e.id === id) { n++; return { ...e, ...patch } }
            if (inScope(base, e, scope)) { n++; return { ...e, ...shared } }
            return e
          }),
          months: patch.month ? withMonths(s.months, [patch.month], s.settings.defaultSalary) : s.months,
        }))
        return n
      },

      removeExpense: (id, scope = "this") => {
        const base = get().expenses.find((e) => e.id === id)
        if (!base) return 0
        const before = get().expenses.length
        set((s) => ({ expenses: s.expenses.filter((e) => !inScope(base, e, scope)) }))
        return before - get().expenses.length
      },
      setStatus: (ids, status) => {
        const set_ = new Set(ids)
        set((s) => ({ expenses: s.expenses.map((e) => (set_.has(e.id) ? { ...e, status } : e)) }))
      },
      removeMany: (ids) => {
        const set_ = new Set(ids)
        set((s) => ({ expenses: s.expenses.filter((e) => !set_.has(e.id)) }))
      },
      duplicateExpense: (id) => {
        const e = get().expenses.find((x) => x.id === id)
        if (!e) return
        set((s) => ({ expenses: [...s.expenses, { ...e, id: uid(), groupId: uid(), description: `${e.description} (cópia)` }] }))
      },

      saveCard: (card) => {
        const id = card.id ?? uid()
        set((s) => {
          const cards = s.settings.cards ?? []
          const next = cards.some((c) => c.id === id) ? cards.map((c) => (c.id === id ? { ...c, ...card, id } : c)) : [...cards, { ...card, id }]
          return { settings: { ...s.settings, cards: next } }
        })
        return id
      },
      removeCard: (id) =>
        set((s) => ({
          settings: { ...s.settings, cards: (s.settings.cards ?? []).filter((c) => c.id !== id) },
          expenses: s.expenses.map((e) => (e.cardId === id ? { ...e, cardId: undefined } : e)),
        })),
      assignCard: (ids, cardId) => {
        const set_ = new Set(ids)
        set((s) => ({ expenses: s.expenses.map((e) => (set_.has(e.id) ? { ...e, cardId, status: e.status === "pending" && cardId ? "billed" : e.status } : e)) }))
        return set_.size
      },

      payInvoice: (month, cardId) => {
        const cards = get().settings.cards ?? []
        const match = (e: Expense) => e.month === month && e.status === "billed" &&
          (cardId ? e.cardId === cardId : !e.cardId || !cards.some((c) => c.id === e.cardId))
        const n = get().expenses.filter(match).length
        set((s) => ({ expenses: s.expenses.map((e) => (match(e) ? { ...e, status: "paid" } : e)) }))
        return n
      },

      changeCurrency: (code, rate) =>
        set((s) => {
          if (!rate || rate === 1) return { settings: { ...s.settings, currency: code } }
          const dec = currencyOf(code).decimals
          const conv = (v: number) => Math.round(v * rate * 10 ** dec) / 10 ** dec
          const convN = (v: number | null | undefined) => (v == null ? v ?? null : conv(v))
          return {
            settings: {
              ...s.settings,
              currency: code,
              defaultSalary: conv(s.settings.defaultSalary || 0),
              cards: s.settings.cards?.map((c) => ({ ...c, limit: c.limit ? conv(c.limit) : c.limit })),
            },
            months: s.months.map((m) => ({ ...m, salary: conv(m.salary) })),
            expenses: s.expenses.map((e) => ({ ...e, amount: conv(e.amount), totalValue: convN(e.totalValue) as number | null })),
          }
        }),

      generateNextMonth: (from) => {
        const next = addMonths(from, 1)
        const { expenses, months, settings } = get()
        const carry = carryCandidates(expenses, from)
        const items = carry.map<Expense>((e) => {
          const ic = e.kind === "installment" ? (e.installmentCurrent ?? 0) + 1 : e.installmentCurrent
          return {
            ...e,
            id: uid(),
            groupId: e.groupId ?? uid(),
            month: next,
            installmentCurrent: ic,
            lastInstallment: e.kind === "installment" ? ic === e.installmentTotal : false,
            status: openStatus(e.method),
          }
        })
        const prevSalary = months.find((m) => m.id === from)?.salary ?? settings.defaultSalary
        set((s) => ({
          expenses: [...s.expenses, ...items],
          months: withMonths(s.months, [next], prevSalary),
          selectedMonth: next,
        }))
        return { month: next, added: items.length }
      },
    }),
    {
      name: "financas-store",
      version: 2,
      // v2: gastos pendentes no cartão de crédito passam a "Na fatura"
      migrate: (persisted, version) => {
        const p = persisted as Partial<State>
        if (version < 2 && p.expenses) p.expenses = p.expenses.map((e) => (e.status === "pending" ? { ...e, status: openStatus(e.method) } : e))
        return p as State
      },
      partialize: (s) => ({ ...s, selectedMonth: s.selectedMonth }),
      // Versões antigas não marcavam a demonstração: reconhece pelos dados fictícios
      merge: (persisted, current) => {
        const p = { ...current, ...(persisted as Partial<State>) }
        if (!p.isDemo && p.initialized && p.settings?.ownerName === "Demo" && p.expenses?.some((e) => e.groupId?.startsWith("demo-")))
          p.isDemo = true
        return p
      },
    }
  )
)
