const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 })

export const money = (v: number) => brl.format(v || 0)
export const moneyCompact = (v: number) => brlCompact.format(v || 0)
export const percent = (v: number) => (Number.isFinite(v) ? pct.format(v) : "—")

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function monthLabel(id: string) {
  const [y, m] = id.split("-").map(Number)
  return `${MONTHS[m - 1]} ${y}`
}
export function monthShort(id: string) {
  const [y, m] = id.split("-").map(Number)
  return `${MONTHS_SHORT[m - 1]}/${String(y).slice(2)}`
}
export function addMonths(id: string, n: number) {
  const [y, m] = id.split("-").map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
export function monthDiff(a: string, b: string) {
  const [ya, ma] = a.split("-").map(Number)
  const [yb, mb] = b.split("-").map(Number)
  return (yb - ya) * 12 + (mb - ma)
}
export function currentMonthId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}
export function formatDate(iso: string | null) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}
/** Converte "1.234,56" ou "1234.56" em número */
export function parseMoney(input: string): number {
  const s = input.replace(/[^\d,.-]/g, "")
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", ".")) || 0
  return Number(s) || 0
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
