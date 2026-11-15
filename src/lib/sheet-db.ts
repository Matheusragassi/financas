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
      properties: { title: `Gastu — dados${ownerName ? ` de ${ownerName}` : ""}`, locale: "pt_BR" },
      sheets: [
        { properties: { title: "Sobre", gridProperties: { columnCount: 3 } } },
        { properties: { title: "Lançamentos", gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: "Meses", gridProperties: { frozenRowCount: 1 } } },
        { properties: { title: "Config", gridProperties: { frozenRowCount: 1 } } },
      ],
    }),
  })
  // Formata em background (não bloqueia a criação)
  upgradeSheetFormat(sheet.spreadsheetId, ownerName).catch(() => {})
  // Marca o arquivo para encontrá-lo em outros aparelhos
  return gfetch<RemoteFile>(`${DRIVE}/${sheet.spreadsheetId}?fields=id,modifiedTime,webViewLink`, {
    method: "PATCH",
    body: JSON.stringify({ appProperties: { [APP_KEY]: "1" }, description: "Dados do app Gastu. Não renomeie as abas." }),
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

/* ─── Formatação para planilhas existentes ─── */

const BRAND = { red: 0.102, green: 0.247, blue: 0.922 }
const DARK_BG = { red: 0.11, green: 0.13, blue: 0.17 }
const WHITE = { red: 1, green: 1, blue: 1 }
const MUTED = { red: 0.6, green: 0.63, blue: 0.68 }

function headerRequests(sheetId: number, cols: number) {
  return [
    { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: cols },
      cell: { userEnteredFormat: { backgroundColor: BRAND, textFormat: { bold: true, foregroundColor: WHITE, fontSize: 10 },
        horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE", padding: { top: 6, bottom: 6 } } }, fields: "userEnteredFormat" } },
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
  ]
}

function sobreContent(ownerName: string) {
  return [
    ["Gastu — Finanças Pessoais", "", ""],
    ["", "", ""],
    ["Esta planilha é o banco de dados do seu app Gastu.", "", ""],
    ["Seus lançamentos, meses e configurações ficam salvos aqui automaticamente.", "", ""],
    ["", "", ""],
    ["ℹ️  Informações", "", ""],
    ["Proprietário", ownerName || "—", ""],
    ["Atualizado em", new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), ""],
    ["Versão do app", "Gastu v1", ""],
    ["Site", "https://matheusragassi.github.io/financas/", ""],
    ["", "", ""],
    ["⚠️  Importante", "", ""],
    ["• Não renomeie as abas (Lançamentos, Meses, Config)", "", ""],
    ["• Você pode consultar os dados diretamente aqui no Sheets", "", ""],
    ["• Alterações manuais serão sobrescritas na próxima sincronização", "", ""],
    ["• Para usar os dados em outra planilha, copie (não mova)", "", ""],
    ["", "", ""],
    ["Feito com ❤️ por MAVI — matheusragassi.art", "", ""],
  ]
}

function sobreFormatRequests(sobreId: number) {
  return [
    { repeatCell: { range: { sheetId: sobreId, startRowIndex: 0, endRowIndex: 18, startColumnIndex: 0, endColumnIndex: 3 },
      cell: { userEnteredFormat: { backgroundColor: DARK_BG, textFormat: { foregroundColor: MUTED, fontSize: 10 } } }, fields: "userEnteredFormat" } },
    { repeatCell: { range: { sheetId: sobreId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 1 },
      cell: { userEnteredFormat: { backgroundColor: DARK_BG, textFormat: { foregroundColor: WHITE, fontSize: 18, bold: true } } }, fields: "userEnteredFormat" } },
    { repeatCell: { range: { sheetId: sobreId, startRowIndex: 5, endRowIndex: 6, startColumnIndex: 0, endColumnIndex: 1 },
      cell: { userEnteredFormat: { textFormat: { foregroundColor: BRAND, fontSize: 11, bold: true } } }, fields: "userEnteredFormat.textFormat" } },
    { repeatCell: { range: { sheetId: sobreId, startRowIndex: 11, endRowIndex: 12, startColumnIndex: 0, endColumnIndex: 1 },
      cell: { userEnteredFormat: { textFormat: { foregroundColor: { red: 0.95, green: 0.75, blue: 0.2 }, fontSize: 11, bold: true } } }, fields: "userEnteredFormat.textFormat" } },
    { repeatCell: { range: { sheetId: sobreId, startRowIndex: 6, endRowIndex: 10, startColumnIndex: 1, endColumnIndex: 2 },
      cell: { userEnteredFormat: { textFormat: { foregroundColor: WHITE } } }, fields: "userEnteredFormat.textFormat" } },
    { updateDimensionProperties: { range: { sheetId: sobreId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 420 }, fields: "pixelSize" } },
    { updateDimensionProperties: { range: { sheetId: sobreId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 }, properties: { pixelSize: 320 }, fields: "pixelSize" } },
  ]
}

/**
 * Atualiza a formatação de uma planilha existente:
 * cria a aba "Sobre" se não existir, formata cabeçalhos e colunas.
 * Seguro para rodar mais de uma vez (idempotente).
 */
export async function upgradeSheetFormat(id: string, ownerName: string): Promise<void> {
  // Buscar metadados da planilha para obter sheetIds
  const meta = await gfetch<{ sheets: { properties: { sheetId: number; title: string } }[] }>(
    `${SHEETS}/${id}?fields=sheets.properties(sheetId,title)`)
  const ids = Object.fromEntries(meta.sheets.map((s) => [s.properties.title, s.properties.sheetId]))

  const requests: unknown[] = []

  // Criar aba "Sobre" se não existe
  let sobreId = ids.Sobre
  if (sobreId == null) {
    // Adicionar a aba na posição 0 (primeira)
    const tempId = 9999
    requests.push({ addSheet: { properties: { sheetId: tempId, title: "Sobre", index: 0, gridProperties: { columnCount: 3 } } } })
    sobreId = tempId
  }

  // Formatação do Sobre
  requests.push(...sobreFormatRequests(sobreId))

  // Formatação das abas de dados (se existirem)
  if (ids["Lançamentos"] != null) {
    requests.push(
      ...headerRequests(ids["Lançamentos"], EXPENSE_COLS.length),
      { updateDimensionProperties: { range: { sheetId: ids["Lançamentos"], dimension: "COLUMNS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 120 }, fields: "pixelSize" } },
      { updateDimensionProperties: { range: { sheetId: ids["Lançamentos"], dimension: "COLUMNS", startIndex: 2, endIndex: 3 }, properties: { pixelSize: 250 }, fields: "pixelSize" } },
      { updateDimensionProperties: { range: { sheetId: ids["Lançamentos"], dimension: "COLUMNS", startIndex: 5, endIndex: 6 }, properties: { pixelSize: 120 }, fields: "pixelSize" } },
      { repeatCell: { range: { sheetId: ids["Lançamentos"], startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 5, endColumnIndex: 6 },
        cell: { userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: "R$ #,##0.00" } } }, fields: "userEnteredFormat.numberFormat" } },
    )
  }
  if (ids.Meses != null) requests.push(...headerRequests(ids.Meses, 2))
  if (ids.Config != null) requests.push(...headerRequests(ids.Config, 2))

  // Aplicar tudo de uma vez
  await gfetch(`${SHEETS}/${id}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests }) })

  // Preencher conteúdo do Sobre
  await gfetch(`${SHEETS}/${id}/values/${encodeURIComponent("Sobre!A1:C18")}:clear`, { method: "POST", body: JSON.stringify({}) })
  await gfetch(`${SHEETS}/${id}/values/${encodeURIComponent("Sobre!A1")}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: sobreContent(ownerName) }),
  })
}
