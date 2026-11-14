import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FunStep { label: string; hint?: string }

/** Etapas de carregamento com tom descontraído: concluídas ✓, atual girando, próximas apagadas */
export function FunSteps({ steps, active, quips, done }: { steps: FunStep[]; active: number; quips?: string[]; done?: boolean }) {
  const [q, setQ] = useState(0)
  useEffect(() => {
    if (!quips?.length || done) return
    const t = setInterval(() => setQ((i) => (i + 1) % quips.length), 1800)
    return () => clearInterval(t)
  }, [quips, done])

  return (
    <div className="space-y-3">
      <ol className="space-y-2.5">
        {steps.map((s, i) => {
          const state = done || i < active ? "done" : i === active ? "active" : "todo"
          return (
            <li key={s.label} className={cn("flex items-start gap-3 text-sm transition-opacity duration-300", state === "todo" && "opacity-40")}>
              <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                state === "done" ? "bg-success/15 text-success" : state === "active" ? "bg-brand/15 text-brand" : "bg-foreground/[0.06]")}>
                {state === "done" ? <Check className="size-3 animate-in zoom-in-50" /> : state === "active" ? <Loader2 className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-muted-foreground/50" />}
              </span>
              <span className="min-w-0">
                <span className={cn("block", state === "active" && "font-medium")}>{s.label}</span>
                {s.hint && state === "active" && <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>}
              </span>
            </li>
          )
        })}
      </ol>
      {quips?.length && !done ? (
        <p key={q} className="text-center text-xs text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-500">{quips[q]}</p>
      ) : null}
    </div>
  )
}
