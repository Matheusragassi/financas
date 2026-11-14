import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Eye, EyeOff, Filter, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TablePager, TableScroll, usePagination } from "@/components/table-pager"
import { cn } from "@/lib/utils"

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  /** Habilita ordenação (clique no cabeçalho) */
  sortValue?: (row: T) => string | number
  /** Habilita filtro rápido por valores da coluna (no painel de Filtros) */
  filterValue?: (row: T) => string
  align?: "left" | "right" | "center"
  className?: string
  /** Começa oculta */
  defaultHidden?: boolean
  /** Não pode ser ocultada */
  fixed?: boolean
}

interface Props<T> {
  id: string
  rows: T[]
  rowId: (row: T) => string
  columns: Column<T>[]
  search?: (row: T) => string
  searchPlaceholder?: string
  label?: string
  pageSize?: number
  fill?: boolean
  selectable?: boolean
  bulkActions?: (ids: string[], clear: () => void) => React.ReactNode
  rowActions?: (row: T) => React.ReactNode
  rowClassName?: (row: T) => string | undefined
  /** Barra de total fixa no rodapé da tabela */
  total?: { label: string; value: (rows: T[]) => React.ReactNode }
  /** Controles extra na barra (ex.: CSV). Deixe-os como ícone (size="icon-sm"). */
  toolbar?: (filtered: T[]) => React.ReactNode
  onFilteredChange?: (filtered: T[]) => void
  emptyText?: string
  initialSort?: { id: string; dir: 1 | -1 }
}

const load = <V,>(k: string, fallback: V): V => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback } catch { return fallback } }
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sem armazenamento */ } }

export function DataTable<T>(props: Props<T>) {
  const { id, rows, rowId, columns, search, selectable, rowActions, total } = props
  const [q, setQ] = useState("")
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 } | null>(props.initialSort ?? null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => load(`table-cols:${id}`, columns.filter((c) => c.defaultHidden).map((c) => c.id)))
  const [hiddenRows, setHiddenRows] = useState<string[]>([])
  const [showHidden, setShowHidden] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => save(`table-cols:${id}`, hiddenCols), [id, hiddenCols])
  const fns = useRef({ columns, search, rowId })
  fns.current = { columns, search, rowId }
  const visibleCols = columns.filter((c) => !hiddenCols.includes(c.id))
  const filterCols = columns.filter((c) => c.filterValue)

  const filtered = useMemo(() => {
    const { columns, search, rowId } = fns.current
    const term = q.trim().toLowerCase()
    let r = rows.filter((row) =>
      (!term || !search || search(row).toLowerCase().includes(term)) &&
      Object.entries(filters).every(([cid, vals]) => {
        const col = columns.find((c) => c.id === cid)
        return !col?.filterValue || vals.length === 0 || vals.includes(col.filterValue(row))
      }) &&
      (showHidden || !hiddenRows.includes(rowId(row))))
    if (sort) {
      const col = columns.find((c) => c.id === sort.id)
      if (col?.sortValue) r = [...r].sort((a, b) => {
        const va = col.sortValue!(a), vb = col.sortValue!(b)
        return (typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR")) * sort.dir
      })
    }
    return r
  }, [rows, q, filters, sort, hiddenRows, showHidden])

  const onFiltered = useRef(props.onFilteredChange)
  onFiltered.current = props.onFilteredChange
  useEffect(() => { onFiltered.current?.(filtered) }, [filtered])

  const pg = usePagination(filtered, id, props.pageSize ?? 20)
  useEffect(() => pg.setPage(0), [q, filters, sort]) // eslint-disable-line

  const sel = [...selected].filter((sid) => filtered.some((r) => rowId(r) === sid))
  const allPageSelected = pg.visible.length > 0 && pg.visible.every((r) => selected.has(rowId(r)))
  const toggle = (rid: string) => setSelected((s) => { const n = new Set(s); if (n.has(rid)) n.delete(rid); else n.add(rid); return n })
  const clear = () => setSelected(new Set())
  const filterCount = Object.values(filters).reduce((a, v) => a + v.length, 0)
  const cycleSort = (cid: string) => setSort((s) => (!s || s.id !== cid ? { id: cid, dir: 1 } : s.dir === 1 ? { id: cid, dir: -1 } : null))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Barra da tabela */}
      <div className="flex flex-wrap items-center gap-2 border-b border-foreground/8 px-3 py-2.5">
        {search && (
          <div className="relative min-w-44 flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={props.searchPlaceholder ?? "Buscar na tabela…"}
              className="h-8 w-full rounded-lg border border-input bg-transparent pr-8 pl-8 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/40 dark:bg-input/30" />
            {q && <button onClick={() => setQ("")} aria-label="Limpar busca" className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {hiddenRows.length > 0 && (
            <IconBtn label={showHidden ? "Esconder ocultas" : `Mostrar ${hiddenRows.length} ocultas`} onClick={() => setShowHidden((v) => !v)} active={showHidden}>
              {showHidden ? <EyeOff /> : <Eye />}
            </IconBtn>
          )}
          {props.toolbar?.(filtered)}
          {filterCols.length > 0 && (
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" size="sm" className={cn("gap-1.5", filterCount > 0 && "border-brand/40 text-foreground")} />
              }>
                <Filter className={cn("size-4", filterCount > 0 && "text-brand")} />
                <span className="hidden sm:inline">Filtros</span>
                {filterCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground">{filterCount}</span>}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-medium">Filtros</span>
                  {filterCount > 0 && <button onClick={() => setFilters({})} className="text-xs text-muted-foreground hover:text-foreground">Limpar tudo</button>}
                </div>
                <div className="max-h-[60vh] overflow-y-auto border-t border-foreground/8">
                  {filterCols.map((c) => (
                    <FilterGroup key={c.id} col={c} rows={rows} value={filters[c.id] ?? []} onChange={(v) => setFilters((f) => ({ ...f, [c.id]: v }))} />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="Colunas" title="Colunas" />}><Columns3 /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
                {columns.filter((c) => !c.fixed).map((c) => (
                  <DropdownMenuCheckboxItem key={c.id} checked={!hiddenCols.includes(c.id)}
                    onCheckedChange={(v) => setHiddenCols((h) => (v ? h.filter((x) => x !== c.id) : [...h, c.id]))}>
                    {c.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setHiddenCols(columns.filter((c) => c.defaultHidden).map((c) => c.id))}>Restaurar padrão</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Ações em massa */}
      {selectable && sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-foreground/8 bg-brand/[0.06] px-3 py-2 animate-in fade-in-0 slide-in-from-top-1">
          <span className="px-1 text-sm font-medium">{sel.length} selecionados</span>
          {props.bulkActions?.(sel, clear)}
          <Button size="sm" variant="secondary" onClick={() => { setHiddenRows((h) => [...new Set([...h, ...sel])]); clear() }}><EyeOff /> Ocultar linhas</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={clear} aria-label="Limpar seleção"><X /></Button>
        </div>
      )}

      <TableScroll empty={filtered.length === 0 && <span>{props.emptyText ?? "Nada encontrado."}{(q || filterCount > 0) && <span className="mt-1 block text-xs">Tente limpar a busca ou os filtros.</span>}</span>}
        className="[&_td]:border-r [&_td]:border-foreground/6 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-foreground/6 [&_th:last-child]:border-r-0 [&_tr]:border-foreground/6 [&_tbody_tr:last-child_td]:border-b [&_tbody_tr:last-child_td]:border-foreground/6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10 pl-3">
                  <Checkbox checked={allPageSelected} aria-label="Selecionar página"
                    onCheckedChange={(v) => setSelected((s) => { const n = new Set(s); pg.visible.forEach((r) => (v ? n.add(rowId(r)) : n.delete(rowId(r)))); return n })} />
                </TableHead>
              )}
              {visibleCols.map((c) => {
                const dir = sort?.id === c.id ? sort.dir : 0
                return (
                  <TableHead key={c.id} className={cn(c.sortValue ? "p-0" : "px-3", c.align === "right" && "text-right", c.className)}>
                    {c.sortValue ? (
                      <button onClick={() => cycleSort(c.id)}
                        className={cn("group/sort flex h-full min-h-10 w-full items-center gap-2 px-3 font-medium transition-colors hover:bg-foreground/[0.06] hover:text-foreground",
                          c.align === "right" ? "flex-row-reverse" : "justify-between", dir && "text-foreground")}>
                        <span className="truncate">{c.header}</span>
                        <span className={cn("flex size-5 shrink-0 items-center justify-center transition-colors", dir ? "text-brand" : "text-muted-foreground/50 group-hover/sort:text-muted-foreground")}>
                          {dir === 1 ? <ArrowUp className="size-3.5" /> : dir === -1 ? <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
                        </span>
                      </button>
                    ) : <span className="font-medium">{c.header}</span>}
                  </TableHead>
                )
              })}
              {rowActions && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.visible.map((row) => {
              const rid = rowId(row)
              return (
                <TableRow key={rid} data-state={selected.has(rid) ? "selected" : undefined}
                  className={cn("transition-colors", hiddenRows.includes(rid) && "opacity-40", props.rowClassName?.(row))}>
                  {selectable && <TableCell className="pl-3"><Checkbox checked={selected.has(rid)} onCheckedChange={() => toggle(rid)} aria-label="Selecionar linha" /></TableCell>}
                  {visibleCols.map((c) => (
                    <TableCell key={c.id} className={cn("px-3", c.align === "right" && "text-right", c.align === "center" && "text-center", c.className)}>{c.cell(row)}</TableCell>
                  ))}
                  {rowActions && <TableCell className="pr-2">{rowActions(row)}</TableCell>}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableScroll>

      {/* Total fixo no rodapé (não acompanha colunas) */}
      {total && (
        <div className="flex items-center justify-between gap-3 border-t border-foreground/10 bg-foreground/[0.02] px-4 py-2.5 text-sm">
          <span className="font-medium text-muted-foreground">{total.label}</span>
          <span className="num font-semibold">{total.value(filtered)}</span>
        </div>
      )}
      <TablePager p={pg} label={props.label} />
    </div>
  )
}

function IconBtn({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <Button variant="outline" size="icon-sm" aria-label={label} title={label} onClick={onClick} className={active ? "border-brand/40 text-brand" : undefined}>{children}</Button>
  )
}

function FilterGroup<T>({ col, rows, value, onChange }: { col: Column<T>; rows: T[]; value: string[]; onChange: (v: string[]) => void }) {
  const values = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((r) => { const v = col.filterValue!(r); m.set(v, (m.get(v) ?? 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  }, [rows, col])
  if (values.length === 0) return null
  return (
    <div className="border-b border-foreground/6 px-1 py-2 last:border-b-0">
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs font-medium text-muted-foreground">{col.header}</span>
        {value.length > 0 && <button onClick={() => onChange([])} className="text-[11px] text-muted-foreground hover:text-foreground">limpar</button>}
      </div>
      <div className="max-h-48 overflow-y-auto">
        {values.map(([v, n]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-foreground/[0.04]">
            <Checkbox checked={value.includes(v)} onCheckedChange={(on) => onChange(on ? [...value, v] : value.filter((x) => x !== v))} />
            <span className="truncate">{v || "—"}</span>
            <span className="num ml-auto text-xs text-muted-foreground">{n}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
