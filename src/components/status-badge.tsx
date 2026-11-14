import { Ban, Check, CircleDashed, CreditCard } from "lucide-react"
import { STATUS_LABEL, type ExpenseStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const STYLE: Record<ExpenseStatus, { cls: string; icon: typeof Check }> = {
  paid: { cls: "bg-success/12 text-success ring-success/25", icon: Check },
  billed: { cls: "bg-brand/12 text-brand ring-brand/25", icon: CreditCard },
  pending: { cls: "bg-warning/12 text-warning ring-warning/25", icon: CircleDashed },
  cancelled: { cls: "bg-muted text-muted-foreground ring-border", icon: Ban },
}

export function StatusBadge({ status, onClick }: { status: ExpenseStatus; onClick?: () => void }) {
  const { cls, icon: Icon } = STYLE[status]
  return (
    <button type="button" onClick={onClick} disabled={!onClick || status === "cancelled"}
      title={onClick ? (status === "paid" ? "Marcar como em aberto" : "Marcar como pago") : undefined}
      className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap ring-1 transition hover:brightness-110 active:scale-95", cls)}>
      <Icon className="size-3" /> {STATUS_LABEL[status]}
    </button>
  )
}
