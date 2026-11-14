import { addMonths } from "./format"
import { active, installmentsOf } from "./stats"
import type { CreditCard, Expense } from "./types"

/** Bancos/emissores comuns com a cor da marca (usada como cor padrão do cartão) */
export const BANKS: { name: string; color: string }[] = [
  { name: "Nubank", color: "#820AD1" },
  { name: "Itaú", color: "#EC7000" },
  { name: "Inter", color: "#FF7A00" },
  { name: "Bradesco", color: "#CC092F" },
  { name: "Santander", color: "#EC0000" },
  { name: "Banco do Brasil", color: "#F2C200" },
  { name: "Caixa", color: "#005CA9" },
  { name: "C6 Bank", color: "#2B2B2B" },
  { name: "Mercado Pago", color: "#00A6E0" },
  { name: "PicPay", color: "#11C76F" },
  { name: "BTG Pactual", color: "#0D2C54" },
  { name: "XP", color: "#1A1A1A" },
  { name: "Neon", color: "#00B4E6" },
  { name: "Banestes", color: "#0067B1" },
  { name: "Sicredi", color: "#3FA535" },
  { name: "Outro", color: "#64748B" },
]
export const NETWORKS = ["Mastercard", "Visa", "Elo", "American Express", "Hipercard"]

export const bankColor = (bank: string) => BANKS.find((b) => b.name === bank)?.color ?? "#64748B"

/** O método de pagamento é cartão de crédito? */
export const isCreditMethod = (method: string) => /cart[aã]o|cr[eé]dito/i.test(method) && !/d[eé]bito/i.test(method)

/** Texto legível sobre a cor do cartão */
export function inkOn(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#0b0b0b" : "#ffffff"
}

export interface CardStats {
  card: CreditCard | null
  /** Fatura do mês (lançamentos do mês neste cartão) */
  month: number
  /** Parcelas que ainda vão cair nos próximos meses */
  future: number
  /** Total comprometido = mês + futuro */
  owed: number
  count: number
  limitUse: number | null
}

/** Estatísticas por cartão para um mês. Inclui "Sem cartão" para gastos no crédito ainda não vinculados. */
export function cardStats(all: Expense[], cards: CreditCard[], month: string): CardStats[] {
  const list = active(all.filter((e) => e.month === month))
  const inst = installmentsOf(all, month)
  const rows = [...cards.map((c) => c as CreditCard | null), null].map((card) => {
    const mine = (e: Expense) => (card ? e.cardId === card.id : !e.cardId || !cards.some((c) => c.id === e.cardId)) && (card ? true : isCreditMethod(e.method))
    const m = list.filter(mine)
    const monthTotal = m.reduce((a, e) => a + e.amount, 0)
    const future = inst.filter((i) => mine(i.expense)).reduce((a, i) => a + i.remainingValue, 0)
    const owed = monthTotal + future
    return { card, month: monthTotal, future, owed, count: m.length, limitUse: card?.limit ? owed / card.limit : null }
  })
  return rows.filter((r) => r.card || r.count > 0).sort((a, b) => (a.card ? 0 : 1) - (b.card ? 0 : 1) || b.owed - a.owed)
}

/** Total gasto por cartão num conjunto de meses (relatórios) */
export function cardTotals(all: Expense[], cards: CreditCard[], inRange: (m: string) => boolean) {
  const list = active(all.filter((e) => inRange(e.month)))
  return cards
    .map((c) => ({ name: c.name, value: list.filter((e) => e.cardId === c.id).reduce((a, e) => a + e.amount, 0), color: c.color }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
}

export const nextDue = (card: CreditCard, month: string) => (card.dueDay ? `${addMonths(month, 0)}-${String(card.dueDay).padStart(2, "0")}` : null)
