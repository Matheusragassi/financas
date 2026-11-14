import { Nfc } from "lucide-react"
import { inkOn } from "@/lib/cards"
import type { CreditCard } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Selo pequeno: bolinha na cor do cartão + nome */
export function CardChip({ card, className }: { card?: CreditCard | null; className?: string }) {
  if (!card) return null
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1.5", className)}>
      <span className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-foreground/10" style={{ background: card.color }} />
      <span className="truncate">{card.name}</span>
    </span>
  )
}

/** Cartão ilustrado (sem dados sensíveis): cor do banco, nome, banco e bandeira */
export function CardVisual({ card, className, children }: { card: CreditCard; className?: string; children?: React.ReactNode }) {
  const ink = inkOn(card.color)
  return (
    <div
      className={cn("relative aspect-[1.586] w-full overflow-hidden rounded-2xl p-4 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]", className)}
      style={{ background: `linear-gradient(135deg, ${card.color}, color-mix(in srgb, ${card.color} 62%, black))`, color: ink }}
    >
      <div aria-hidden className="absolute -top-10 -right-10 size-40 rounded-full bg-white/15 blur-2xl" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent_45%)]" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-medium tracking-wide uppercase opacity-80">{card.bank}</div>
            <div className="truncate text-base font-semibold">{card.name}</div>
          </div>
          <Nfc className="size-5 shrink-0 opacity-70" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">{children}</div>
          {card.network && <div className="shrink-0 text-xs font-semibold italic opacity-90">{card.network}</div>}
        </div>
      </div>
    </div>
  )
}
