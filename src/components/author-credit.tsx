import { cn } from "@/lib/utils"

/** Assinatura do autor */
export function AuthorCredit({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-[11px] text-muted-foreground", className)}>
      <span>Pixelated with care by</span>
      <img src="./logo-autor.webp" alt="logo do autor" className="h-3.5 w-auto [image-rendering:pixelated]" />
    </div>
  )
}
