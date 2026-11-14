import { MaviLogo } from "@/components/app-logo"
import { cn } from "@/lib/utils"

export const PORTFOLIO_URL = "https://www.matheusragassi.art/"

/** Assinatura do autor (MAVI), com link para o portfólio */
export function AuthorCredit({ className }: { className?: string }) {
  return (
    <a
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener"
      title="Portfólio de Matheus Ragassi"
      className={cn("group/credit flex items-center gap-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground", className)}
    >
      <span>Pixelated with care by</span>
      <MaviLogo className="h-2.5 w-auto text-foreground/70 transition-colors group-hover/credit:text-brand" />
    </a>
  )
}
