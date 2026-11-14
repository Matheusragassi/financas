import { isCreditMethod } from "./cards"
import type { ExpenseStatus } from "./types"

/** Status de um lançamento ainda não pago: no crédito ele já está "na fatura" */
export const openStatus = (method: string, cardId?: string): ExpenseStatus => (isCreditMethod(method) || !!cardId ? "billed" : "pending")
