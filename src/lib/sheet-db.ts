import { gfetch } from "./google"
import { DEFAULT_SETTINGS } from "./store"
import type { Backup, Expense, ExpenseKind, ExpenseStatus, Month } from "./types"

/*
 * Planilha no Drive do usuário usada como banco de dados.
 * Abas: "Lançamentos", "Meses" e "Config". Formato simples, uma linha por registro.
 */

const SHEETS = "https://sheets.googleapis.com/v4/spreadsheets"
const DRIVE = "https://www.googleapis.com/drive/v3/files"
const APP_KEY = "financasApp"

const EXPENSE_COLS = [
  "id", "mes", "descricao", "categoria", "metodo", "valor", "tipo", "data_compra",
  "parcela_atual", "parcelas_total", "valor_total", "essencial", "status", "ultima_parcela", "observacao", "grupo", "cartao",
] as const

export interface RemoteFile { id: string; modifiedTime: string; webViewLink?: string }

export async function findDataFile(): Promise<RemoteFile | null> {
  const q = encodeURIComponent(`appProperties has { key='${APP_KEY}' and value='1' } and trashed=false`)
  const r = await gfetch<{ files: RemoteFile[] }>(`${DRIVE}?q=${q}&orderBy=modifiedTime desc&fields=files(id,modifiedTime,webViewLink)&pageSize=5`)
  return r.files[0] ?? null
}

export const getFileMeta = (id: string) => gfetch<RemoteFile>(`${DRIVE}/${id}?fields=id,modifiedTime,webViewLink`)

export async function createDataFile(ownerName: string): Promise<RemoteFile> {
  const sheet = await gfetch<{ spreadsheetId: string }>(SHEETS, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: `Finitree — dados${ownerName ? ` de ${ownerName}` : ""}`, locale: "pt_BR" },
      sheets: ["Lançamentos", "Meses", "Config"].map((title) => ({ properties: { title, gridProperties: { frozenRowCount: 1 } } })),
    }),
  })
  // Marca o arquivo para encontrá-lo em outros aparelhos
  return gfetch<RemoteFile>(`${DRIVE}/${sheet.spreadsheetId}?fields=id,modifiedTime,webViewLink`, {
    method: "PATCH",
    body: JSON.stringify({ appProperties: { [APP_KEY]: "1" }, description: "Dados do app Finitree. Não renomeie as abas." }),
  })
}

const str = (v: unknown) => (v == null ? "" : String(v))
const num = (v: unknown) => (v === "" || v == null ? null : Number(v))
const bool = (v: unknown) => v === true || str(v).toUpperCase() === "TRUE"

export async function readData(id: string): Promise<Backup> {
  const ranges = ["Lançamentos!A1:Q", "Meses!A1:B", "Config!A1:B"].map((r) => `ranges=${encodeURIComponent(r)}`).join("&")
  const r = await gfetch<{ valueRanges: { values?: unknown[][] }[] }>(
    `${SHEETS}/${id}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`)
  const [exp, mon, cfg] = r.valueRanges.map((v) => v.values ?? [])

  const header = (exp[0] ?? []).map(str)
  const col = (name: string) => header.indexOf(name)
  const expenses: Expense[] = exp.slice(1).filter((row) => str(row[col("id")]) && str(row[col("mes")])).map((row) => {
    const g = (n: string) => row[col(n)]
    return {
      id: str(g("id")),
      month: str(g("mes")),
      description: str(g("descricao")),
      category: str(g("categoria")) || "Outros",
      method: str(g("metodo")) || "Outros",
      amount: Number(g("valor")) || 0,
      kind: (str(g("tipo")) || "single") as ExpenseKind,
      purchaseDate: str(g("data_compra")) || null,
      installmentCurrent: num(g("parcela_atual")),
      installmentTotal: num(g("parcelas_total")),
      totalValue: num(g("valor_total")),
      essential: bool(g("essencial")),
      status: (str(g("status")) || "pending") as ExpenseStatus,
      lastInstallment: bool(g("ultima_parcela")),
      note: str(g("observacao")) || undefined,
      groupId: str(g("grupo")) || undefined,
      cardId: col("cartao") >= 0 ? str(g("cartao")) || undefined : undefined,
    }
  })
  const months: Month[] = mon.slice(1).filter((row) => str(row[0])).map((row) => ({ id: str(row[0]), salary: Number(row[1]) || 0 }))
  const cfgMap = Object.fromEntries(cfg.slice(1).map((row) => [str(row[0]), str(row[1])]))
  let settings = DEFAULT_SETTINGS
  try { settings = { ...DEFAULT_SETTINGS, ...JSON.parse(cfgMap.settings || "{}") } } catch { /* mantém padrão */ }
  return { app: "financas", version: 1, exportedAt: cfgMap.updatedAt || new Date().toISOString(), settings, months, expenses, rev: cfgMap.rev || "" }
}

/** Versão gravada a cada salvamento (detecta mudanças vindas de outro aparelho) */
export async function getRemoteRev(id: string): Promise<string> {
  const r = await gfetch<{ values?: unknown[][] }>(`${SHEETS}/${id}/values/${encodeURIComponent("Config!A1:B10")}`)
  return str((r.values ?? []).find((row) => row[0] === "rev")?.[1])
}

const newRev = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export async function writeData(id: string, b: Backup): Promise<string> {
  const rev = newRev()
  const expRows = [
    [...EXPENSE_COLS],
    ...b.expenses.map((e) => [
      e.id, e.month, e.description, e.category, e.method, e.amount, e.kind, e.purchaseDate ?? "",
      e.installmentCurrent ?? "", e.installmentTotal ?? "", e.totalValue ?? "", e.essential, e.status,
      !!e.lastInstallment, e.note ?? "", e.groupId ?? "", e.cardId ?? "",
    ]),
  ]
  const monRows = [["mes", "renda"], ...b.months.map((m) => [m.id, m.salary])]
  const cfgRows = [["chave", "valor"], ["settings", JSON.stringify(b.settings)], ["updatedAt", new Date().toISOString()], ["rev", rev], ["app", "financas v1"]]
  await gfetch(`${SHEETS}/${id}/values:batchClear`, { method: "POST", body: JSON.stringify({ ranges: ["Lançamentos!A:Z", "Meses!A:Z", "Config!A:Z"] }) })
  await gfetch(`${SHEETS}/${id}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: [
        { range: "Lançamentos!A1", values: expRows },
        { range: "Meses!A1", values: monRows },
        { range: "Config!A1", values: cfgRows },
      ],
    }),
  })
  return rev
}
