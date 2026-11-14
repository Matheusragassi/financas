import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const TONE = {
  default: "bg-foreground/[0.05] text-muted-foreground",
  good: "bg-success/12 text-success",
  bad: "bg-critical/12 text-critical",
  warn: "bg-warning/12 text-warning",
} as const

export function StatCard({
  label, value, hint, icon: Icon, tone = "default", children,
}: {
  label: string
  value: string
  hint?: React.ReactNode
  icon?: LucideIcon
  tone?: "default" | "good" | "bad" | "warn"
  children?: React.ReactNode
}) {
  return (
    <Card size="sm" className="group/stat gap-0 transition-[box-shadow,border-color] duration-300 hover:ring-foreground/15">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
          {Icon && (
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors", TONE[tone])}>
              <Icon className="size-4" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className={cn(
            "num text-[1.7rem] leading-none font-semibold tracking-tight",
            tone === "bad" && "text-critical",
            tone === "good" && "text-success",
          )}>{value}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
