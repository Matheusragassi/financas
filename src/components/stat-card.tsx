import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
    <Card size="sm" className="gap-0">
      <CardContent className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{label}</span>
          {Icon && <Icon className="size-4" />}
        </div>
        <div className={cn(
          "num text-2xl font-semibold tracking-tight",
          tone === "bad" && "text-critical",
          tone === "good" && "text-success",
        )}>{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        {children}
      </CardContent>
    </Card>
  )
}
