import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SimpleSelect } from "@/components/simple-select"
import { cn } from "@/lib/utils"

const SIZES = [10, 20, 50, 100]

/** Paginação com tamanho de página lembrado por tabela */
export function usePagination<T>(rows: T[], key: string, initial = 20) {
  const [size, setSizeState] = useState<number>(() => {
    try { const v = Number(localStorage.getItem(`page-size:${key}`)); return SIZES.includes(v) ? v : initial } catch { return initial }
  })
  const [page, setPage] = useState(0)
  const pages = Math.max(1, Math.ceil(rows.length / size))
  useEffect(() => { if (page > pages - 1) setPage(pages - 1) }, [page, pages])
  const visible = useMemo(() => rows.slice(page * size, page * size + size), [rows, page, size])
  const setSize = (n: number) => {
    setSizeState(n); setPage(0)
    try { localStorage.setItem(`page-size:${key}`, String(n)) } catch { /* sem armazenamento */ }
  }
  return { visible, page, setPage, size, setSize, pages, total: rows.length, reset: () => setPage(0) }
}

/**
 * Área da tabela que preenche o espaço do cartão (flex-1), com rolagem interna,
 * cabeçalho e rodapé fixos. Quando vazia, mostra a mensagem centralizada.
 */
export function TableScroll({ children, className, empty }: { children: React.ReactNode; className?: string; empty?: React.ReactNode }) {
  return (
    <div className={cn(
      "relative min-h-0 flex-1",
      "[&_[data-slot=table-container]]:absolute [&_[data-slot=table-container]]:inset-0 [&_[data-slot=table-container]]:overflow-auto [&_[data-slot=table-container]]:overscroll-contain",
      "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-card/95 [&_thead]:backdrop-blur-xl [&_thead]:shadow-[0_1px_0_var(--border)]",
      "[&_tfoot]:sticky [&_tfoot]:bottom-0 [&_tfoot]:z-10 [&_tfoot]:bg-card/95 [&_tfoot]:backdrop-blur-xl",
      className,
    )}>
      {children}
      {empty && (
        <div className="pointer-events-none absolute inset-x-0 top-10 bottom-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
  )
}

/** Cartão de tabela: coluna flexível com altura mínima; `fill` estica até o fim da tela */
export const tableCardClass = (fill?: boolean) =>
  cn("flex flex-col gap-0 overflow-hidden py-0", fill ? "min-h-[440px] flex-1" : "h-[min(72vh,680px)] min-h-[420px]")

export function TablePager({ p, label = "itens" }: { p: ReturnType<typeof usePagination<unknown>>; label?: string }) {
  const from = p.total ? p.page * p.size + 1 : 0
  const to = Math.min(p.total, (p.page + 1) * p.size)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/6 px-4 py-3 text-xs text-muted-foreground">
      <div className="num">
        <span className="font-medium text-foreground">{from}–{to}</span> de <span className="font-medium text-foreground">{p.total}</span> {label}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span>Por página</span>
          <SimpleSelect size="sm" className="w-[72px]" value={String(p.size)} onChange={(v) => p.setSize(Number(v))}
            options={SIZES.map((n) => ({ value: String(n), label: String(n) }))} />
        </div>
        <span className="num">Página {p.page + 1} de {p.pages}</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Primeira página" disabled={p.page === 0} onClick={() => p.setPage(0)} className="hidden sm:inline-flex"><ChevronsLeft /></Button>
          <Button variant="outline" size="icon-sm" aria-label="Página anterior" disabled={p.page === 0} onClick={() => p.setPage(p.page - 1)}><ChevronLeft /></Button>
          <Button variant="outline" size="icon-sm" aria-label="Próxima página" disabled={p.page >= p.pages - 1} onClick={() => p.setPage(p.page + 1)}><ChevronRight /></Button>
          <Button variant="outline" size="icon-sm" aria-label="Última página" disabled={p.page >= p.pages - 1} onClick={() => p.setPage(p.pages - 1)} className="hidden sm:inline-flex"><ChevronsRight /></Button>
        </div>
      </div>
    </div>
  )
}
