import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Painel da Visão geral em carregamento */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-7 w-44" /></div>
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} size="sm" className="gap-0">
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between"><Skeleton className="h-3.5 w-20" /><Skeleton className="size-7 rounded-lg" /></div>
              <Skeleton className="h-7 w-28" /><Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="space-y-4"><Skeleton className="h-4 w-40" /><Skeleton className="h-[260px] w-full rounded-xl" /></CardContent></Card>
        <Card><CardContent className="space-y-3"><Skeleton className="h-4 w-28" />{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</CardContent></Card>
      </div>
    </div>
  )
}

/** Tabela em carregamento */
export function TableSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-6 md:space-y-8", className)}>
      <div className="flex items-end justify-between"><div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-40" /></div><Skeleton className="h-7 w-28" /></div>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b border-foreground/8 p-3"><Skeleton className="h-8 w-full max-w-xs" /></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-foreground/6 px-4 py-3 last:border-0">
            <Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" />
          </div>
        ))}
      </Card>
    </div>
  )
}
