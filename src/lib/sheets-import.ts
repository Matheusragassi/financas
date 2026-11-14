import { currentMonthId } from "./format"
import { DEFAULT_SETTINGS } from "./store"
import { isCreditMethod } from "./cards"
import type { Backup, Expense, ExpenseKind } from "./types"

/**
 * Importa uma planilha do Google compartilhada por link ("qualquer pessoa com o link pode ver").
 * Cada aba no formato "Mês - Ano" vira um mês; as colunas são reconhecidas pelo cabeçalho.
 * Lê a versão HTML pública, que preserva caixas de seleção e cores (cancelado / última parcela).
 */

const MONTHS = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
const ABBR: Record<string, number> = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 }

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim()

export function sheetIdFromUrl(url: string) {
  return url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ?? (/^[a-zA-Z0-9-_]{30,}$/.test(url.trim()) ? url.trim() : null)
}

function money(v: string): number | null {
  let s = v.replace(/R\$|\s/g, "")
  if (!s) return null
  const neg = s.startsWith("-")
  s = s.replace(/^-/, "")
  s = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s
  const n = Number(s)
  return Number.isFinite(n) ? (neg ? -n : n) : null
}

function parseDate(v: string): string | null {
  const m = norm(v).match(/(\d{1,2})\s*de\s*([a-z]{3})\.?\s*(\d{2,4})/)
  if (m && ABBR[m[2]]) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${String(ABBR[m[2]]).padStart(2, "0")}-${m[1].padStart(2, "0")}`
  }
  const d = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (d) return `${d[3].length === 2 ? `20${d[3]}` : d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`
  return null
}

const inst = (v: string) => { const m = norm(v).match(/(\d+)\s*x?/); return m ? parseInt(m[1]) : null }
const slug = (s: string) => norm(s).replace(/[^a-z0-9]/g, "").slice(0, 40)

interface Cell { cls: string; text: string }

/** Monta a grade da tabela respeitando células mescladas */
function grid(table: HTMLTableElement): Cell[][] {
  const out: Cell[][] = []
  const pending = new Map<string, Cell>()
  Array.from(table.rows).forEach((tr, ri) => {
    const row: Cell[] = []
    let col = 0
    const fill = () => { while (pending.has(`${ri}:${col}`)) { row.push(pending.get(`${ri}:${col}`)!); pending.delete(`${ri}:${col}`); col++ } }
    for (const td of Array.from(tr.cells)) {
      if (td.tagName !== "TD") continue
      fill()
      let text = td.textContent?.trim() ?? ""
      const use = td.querySelector("use")?.getAttribute("href") ?? ""
      if (use.includes("unchecked-checkbox")) text = "FALSE"
      else if (use.includes("checked-checkbox")) text = "TRUE"
      const cell = { cls: td.className, text }
      const cs = td.colSpan || 1, rs = td.rowSpan || 1
      for (let dr = 0; dr < rs; dr++)
        for (let dc = 0; dc < cs; dc++)
          if (dr || dc) pending.set(`${ri + dr}:${col + dc}`, dr === 0 ? { cls: cell.cls, text: "" } : { cls: cell.cls, text: "" })
      row.push(cell); col++
      for (let dc = 1; dc < cs; dc++) { row.push(pending.get(`${ri}:${col}`)!); pending.delete(`${ri}:${col}`); col++ }
    }
    fill()
    out.push(row)
  })
  return out
}

type Field = "date" | "nTotal" | "nCur" | "total" | "category" | "desc" | "amount" | "essential" | "method" | "status"
const HEADERS: [Field, RegExp][] = [
  ["date", /^data/],
  ["nTotal", /parcela.*total|total.*parcela|^parcelas$/],
  ["nCur", /parcela atual/],
  ["total", /^valor total/],
  ["category", /^tipo|categoria/],
  ["desc", /produto|descri|servico|item/],
  ["amount", /valor ?\/ ?parcela|^valor$|valor mensal|valor da parcela/],
  ["essential", /necessari|essencia/],
  ["method", /metodo|pagamento|forma/],
  ["status", /^status|^pago/],
]

function parseTab(doc: Document, monthId: string, currentMonth: string) {
  const table = doc.querySelector("table") as HTMLTableElement | null
  if (!table) return null
  const css = new Map<string, string>()
  const styleText = Array.from(doc.querySelectorAll("style")).map((st) => st.textContent ?? "").join("\n")
  for (const m of styleText.matchAll(/\.(s\d+)\{([^}]*)\}/g)) css.set(m[1], m[2])
  const bgOf = (cls: string) => cls.split(/\s+/).map((c) => css.get(c)?.match(/background-color:(#[0-9a-f]{6})/i)?.[1]?.toLowerCase()).find(Boolean)
  const strike = (cls: string) => cls.split(/\s+/).some((c) => css.get(c)?.includes("line-through"))
  const rows = grid(table)

  let salary: number | null = null
  let cancelBg: string | undefined, lastBg: string | undefined
  for (const r of rows) {
    const txt = r.map((c) => c.text).join(" ")
    const sm = txt.match(/sal[aá]rio[^:]*:\s*R\$\s*([\d.,]+)/i)
    if (sm && salary == null) {
      let s = sm[1]
      if (/\.\d{2}$/.test(s) && !s.includes(",")) s = s.slice(0, -3) // "2.400.00"
      salary = Number(s.replace(/\./g, "").replace(",", ".")) || null
    }
    if (norm(r[0]?.text ?? "") === "legenda" && r[1]) {
      if (/cancelad/i.test(r[1].text)) cancelBg = bgOf(r[0].cls)
      if (/ultima|última/i.test(r[1].text)) lastBg = bgOf(r[0].cls)
    }
  }

  const hi = rows.findIndex((r) => r.some((c) => /produto|descri/.test(norm(c.text))) && r.some((c) => /valor/.test(norm(c.text))))
  if (hi < 0) return null
  const map = new Map<Field, number>()
  rows[hi].forEach((c, i) => {
    const h = norm(c.text)
    if (!h) return
    for (const [f, re] of HEADERS) if (!map.has(f) && re.test(h)) { map.set(f, i); break }
  })
  if (!map.has("desc") || !map.has("amount")) return null
  const get = (r: Cell[], f: Field) => (map.has(f) ? r[map.get(f)!]?.text ?? "" : "")

  const expenses: Expense[] = []
  for (const r of rows.slice(hi + 1)) {
    const first = norm(r[0]?.text ?? "")
    if (first.startsWith("total") || first === "legenda") break
    const desc = get(r, "desc").trim()
    const amount = money(get(r, "amount"))
    const extra = r.some((c) => /^gastos extras/i.test(c.text))
    if (extra) {
      if (amount) expenses.push(mk({ kind: "extra", description: "Gastos extras", category: "Extras", amount, essential: get(r, "essential") === "TRUE", method: get(r, "method") || "Outros" }))
      continue
    }
    if (!desc || amount == null) continue
    const bgs = new Set(r.slice(0, map.size + 1).map((c) => bgOf(c.cls)).filter((b) => b && b !== "#ffffff"))
    const cancelled = (!!cancelBg && bgs.has(cancelBg)) || r.some((c) => strike(c.cls))
    const isLast = !!lastBg && bgs.has(lastBg)
    const d0 = get(r, "date")
    const pd = parseDate(d0)
    let nT = inst(get(r, "nTotal")), nC = inst(get(r, "nCur"))
    const recurring = /anual|mensal/.test(norm(get(r, "nTotal") + get(r, "nCur")))
    let kind: ExpenseKind = norm(d0).startsWith("fixo") || (!pd && !nT) ? "fixed" : nT && nT > 1 ? "installment" : "single"
    if (recurring) kind = "subscription"
    if (kind !== "installment") { nT = null; nC = null }
    const st = norm(get(r, "status"))
    const status = cancelled || /cancel/.test(st) ? "cancelled"
      : st === "true" || /^pago/.test(st) ? "paid"
      : st === "false" || /pend|aberto/.test(st) ? "pending"
      : monthId < currentMonth ? "paid" : isCreditMethod(get(r, "method")) ? "billed" : "pending"
    expenses.push(mk({
      kind, description: desc, category: get(r, "category").trim() || "Outros", amount,
      essential: get(r, "essential") === "TRUE" || /^sim/.test(norm(get(r, "essential"))),
      method: get(r, "method").trim() || "Outros", purchaseDate: pd, installmentTotal: nT, installmentCurrent: nC,
      totalValue: money(get(r, "total")), status, lastInstallment: kind === "installment" && (isLast || (!!nT && nT === nC)),
    }))
  }

  function mk(p: Partial<Expense> & Pick<Expense, "kind" | "description" | "category" | "amount" | "essential" | "method">): Expense {
    const e: Expense = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4), month: monthId,
      purchaseDate: null, installmentTotal: null, installmentCurrent: null, totalValue: null, status: monthId < currentMonth ? "paid" : "pending",
      lastInstallment: false, ...p,
    }
    e.groupId = `g-${slug(e.description)}-${e.purchaseDate ?? e.kind}`
    return e
  }
  return { salary, expenses }
}

export interface ImportProgress { done: number; total: number; tab: string }

export async function importFromGoogleSheet(url: string, onProgress?: (p: ImportProgress) => void): Promise<Backup> {
  const id = sheetIdFromUrl(url)
  if (!id) throw new Error("Link inválido. Cole o link completo da planilha do Google.")
  const base = `https://docs.google.com/spreadsheets/d/${id}`
  let index: string
  try {
    const res = await fetch(`${base}/htmlview`)
    if (!res.ok) throw new Error()
    index = await res.text()
  } catch {
    throw new Error("Não consegui abrir a planilha. Verifique sua internet e se ela está compartilhada como “Qualquer pessoa com o link pode ver”.")
  }
  if (/ServiceLogin|accounts\.google\.com/.test(index) && !/items\.push/.test(index))
    throw new Error("A planilha é privada. Compartilhe como “Qualquer pessoa com o link pode ver” e tente de novo.")

  const tabs = [...index.matchAll(/name: "((?:[^"\\]|\\.)*)", pageUrl: "[^"]*", gid: "(\d+)"/g)]
    .map((m) => ({ name: JSON.parse(`"${m[1]}"`) as string, gid: m[2] }))
    .map((t) => {
      const m = norm(t.name).match(/^([a-z]+)\s*[-/ ]\s*(\d{4})$/)
      const mi = m ? MONTHS.indexOf(m[1]) : -1
      return mi >= 0 ? { ...t, month: `${m![2]}-${String(mi + 1).padStart(2, "0")}` } : null
    })
    .filter((t): t is { name: string; gid: string; month: string } => !!t)
  if (!tabs.length) throw new Error("Não encontrei abas de mês (ex.: “Janeiro - 2025”) nesta planilha.")

  const now = currentMonthId()
  const parser = new DOMParser()
  const results: { month: string; salary: number | null; expenses: Expense[] }[] = []
  let done = 0
  const queue = [...tabs]
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const t = queue.shift()!
      const html = await (await fetch(`${base}/htmlview/sheet?headers=false&gid=${t.gid}`)).text()
      const parsed = parseTab(parser.parseFromString(html, "text/html"), t.month, now)
      if (parsed) results.push({ month: t.month, ...parsed })
      onProgress?.({ done: ++done, total: tabs.length, tab: t.name })
    }
  }))
  if (!results.length) throw new Error("Não reconheci as colunas. A planilha precisa ter cabeçalhos como “Produto/serviço” e “Valor”.")

  results.sort((a, b) => a.month.localeCompare(b.month))
  let lastSalary = 0
  const months = results.map((r) => { lastSalary = r.salary ?? lastSalary; return { id: r.month, salary: lastSalary } })
  const expenses = results.flatMap((r) => r.expenses)
  const titleName = index.match(/DASHBOARD[^"<]*? - ([A-ZÀ-Ú][A-Za-zÀ-ú]+)/)?.[1] ?? ""
  return {
    app: "financas", version: 1, exportedAt: new Date().toISOString(),
    settings: {
      ...DEFAULT_SETTINGS, ownerName: titleName, defaultSalary: lastSalary, sheetUrl: url.trim(),
      categories: [...new Set([...DEFAULT_SETTINGS.categories, ...expenses.map((e) => e.category)])],
      methods: [...new Set([...DEFAULT_SETTINGS.methods, ...expenses.map((e) => e.method)])],
    },
    months, expenses,
  }
}
