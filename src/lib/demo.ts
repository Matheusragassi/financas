import { addMonths, currentMonthId, uid } from "./format"
import { DEFAULT_SETTINGS } from "./store"
import type { Backup, Expense } from "./types"

/** Dados fictícios para explorar o app */
export function demoBackup(): Backup {
  const now = currentMonthId()
  const start = addMonths(now, -11)
  const expenses: Expense[] = []
  const fixed = [
    ["Aluguel", "Serviço", 1200, true, "Pagamento à P."],
    ["Internet", "Serviço", 100, true, "Cartão de C."],
    ["Celular", "Serviço", 55, true, "Cartão de C."],
    ["Streaming de vídeo", "Assinatura", 45, false, "Assinatura"],
    ["Música", "Assinatura", 22, false, "Assinatura"],
    ["Academia", "Saúde", 110, false, "Débito"],
    ["Transporte", "Transporte", 220, true, "PIX"],
    ["Mercado", "Alimentação", 650, true, "Cartão de C."],
  ] as const
  const buys = [
    { d: "Notebook", c: "Produto", total: 4800, n: 10, at: 1 },
    { d: "Tênis", c: "Produto", total: 450, n: 3, at: 3 },
    { d: "Cadeira de escritório", c: "Produto", total: 1200, n: 6, at: 5 },
    { d: "Presente aniversário", c: "Presentes", total: 300, n: 2, at: 7 },
    { d: "Fone bluetooth", c: "Produto", total: 600, n: 4, at: 8 },
    { d: "Curso online", c: "Serviço", total: 960, n: 12, at: 9 },
  ]
  for (let i = 0; i < 12; i++) {
    const month = addMonths(start, i)
    const status = month < now ? "paid" : "pending"
    for (const [d, c, v, ess, m] of fixed) {
      const jitter = c === "Alimentação" ? Math.round((Math.sin(i * 1.7) + 1) * 90) : 0
      expenses.push({
        id: uid(), month, description: d, category: c, method: m, amount: v + jitter,
        kind: c === "Assinatura" ? "subscription" : "fixed", purchaseDate: null,
        installmentTotal: null, installmentCurrent: null, totalValue: null,
        essential: ess, status, groupId: `demo-${d}`,
      })
    }
    for (const b of buys) {
      const k = i - b.at + 1
      if (k < 1 || k > b.n) continue
      const [y, mm] = addMonths(start, b.at).split("-")
      expenses.push({
        id: uid(), month, description: b.d, category: b.c, method: "Cartão de C.",
        amount: Math.round((b.total / b.n) * 100) / 100, kind: "installment",
        purchaseDate: `${y}-${mm}-10`, installmentTotal: b.n, installmentCurrent: k,
        totalValue: b.total, essential: false, status, lastInstallment: k === b.n, groupId: `demo-${b.d}`,
      })
    }
    if (i % 3 === 1)
      expenses.push({
        id: uid(), month, description: "Restaurante", category: "Alimentação", method: "PIX", amount: 180,
        kind: "single", purchaseDate: `${month}-15`, installmentTotal: null, installmentCurrent: null,
        totalValue: 180, essential: false, status,
      })
  }
  return {
    app: "financas", version: 1, exportedAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS, ownerName: "Demo", defaultSalary: 4500 },
    months: Array.from({ length: 12 }, (_, i) => ({ id: addMonths(start, i), salary: 4500 })),
    expenses,
  }
}
