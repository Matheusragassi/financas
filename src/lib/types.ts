export type ExpenseKind = "fixed" | "installment" | "single" | "subscription" | "extra"
export type ExpenseStatus = "paid" | "pending" | "cancelled"

export interface Expense {
  id: string
  /** Mês de competência no formato YYYY-MM */
  month: string
  description: string
  category: string
  method: string
  /** Valor cobrado neste mês (parcela) */
  amount: number
  kind: ExpenseKind
  purchaseDate: string | null
  installmentTotal: number | null
  installmentCurrent: number | null
  /** Valor total da compra */
  totalValue: number | null
  essential: boolean
  status: ExpenseStatus
  lastInstallment?: boolean
  note?: string
  /** Liga lançamentos da mesma compra/assinatura entre meses */
  groupId?: string
  /** Cartão de crédito usado (id em Settings.cards) */
  cardId?: string
}

export interface CreditCard {
  id: string
  /** Apelido, ex.: "Nubank roxinho" */
  name: string
  bank: string
  /** Bandeira (opcional) */
  network?: string
  color: string
  limit?: number
  dueDay?: number
}

export interface Month {
  id: string
  salary: number
}

export interface Settings {
  /** Primeiro nome */
  ownerName: string
  lastName?: string
  email?: string
  /** Foto de perfil (data URL reduzida) */
  photo?: string
  defaultSalary: number
  categories: string[]
  methods: string[]
  budgetAlert: number
  /** Link da planilha do Google usada na importação */
  sheetUrl?: string
  cards?: CreditCard[]
  /** Código ISO da moeda (padrão BRL) */
  currency?: string
}

export interface Backup {
  app: "financas"
  version: number
  exportedAt: string
  settings: Settings
  months: Month[]
  expenses: Expense[]
  /** versão remota (sincronização) */
  rev?: string
}

export const KIND_LABEL: Record<ExpenseKind, string> = {
  fixed: "Fixo",
  installment: "Parcelado",
  single: "À vista",
  subscription: "Assinatura",
  extra: "Extra",
}

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
}
