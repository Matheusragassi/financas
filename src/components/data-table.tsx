import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown, ArrowUp, ArrowUpDown, Columns3, EyeOff, Eye, Filter, Search, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TablePager, TableScroll, usePagination } from "@/components/table-pager"
import { cn } from "@/lib/utils"

export interface Column<T> {
  id: string
  header: string
  cell: (row: T) => React.ReactNode
  /** Habilita ordenação */
  sortValue?: (row: T) => string | number
  /** Habilita filtro rápido por valores da coluna */
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
  /** Linha de total: rótulo + valor posicionado sob a coluna indicada */
  total?: { label: string; columnId: string; value: (rows: T[]) => React.ReactNode }
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
  // Funções podem mudar a cada render do pai; usamos sempre a versão mais recente sem refazer o filtro
  const fns = useRef({ columns, search, rowId })
  fns.current = { columns, search, rowId }
  const visibleCols = columns.filter((c) => !hiddenCols.includes(c.id))

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
  const activeFilters = Object.entries(filters).filter(([, v]) => v.length > 0)
  const totalColIndex = total ? visibleCols.findIndex((c) => c.id === total.columnId) : -1

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
        {activeFilters.map(([cid, vals]) => (
          <span key={cid} className="flex h-7 items-center gap-1 rounded-full bg-brand/10 pr-1 pl-2.5 text-xs text-foreground ring-1 ring-brand/25">
            <Filter className="size-3 text-brand" />
            {columns.find((c) => c.id === cid)?.header}: {vals.length === 1 ? vals[0] : `${vals.length} valores`}
            <button onClick={() => setFilters((f) => ({ ...f, [cid]: [] }))} aria-label="Remover filtro" className="rounded-full p-0.5 hover:bg-foreground/10"><X className="size-3" /></button>
          </span>
        ))}
        {(activeFilters.length > 0 || q || sort) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilters({}); setQ(""); setSort(props.initialSort ?? null) }}>Limpar</Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {hiddenRows.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowHidden((v) => !v)}>
              {showHidden ? <EyeOff /> : <Eye />} {showHidden ? "Esconder" : "Mostrar"} ocultas ({hiddenRows.length})
            </Button>
          )}
          {props.toolbar?.(filtered)}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}><Columns3 /> <span className="hidden sm:inline">Colunas</span></DropdownMenuTrigger>
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

      <TableScroll empty={filtered.length === 0 && <span>{props.emptyText ?? "Nada encontrado."}{(q || activeFilters.length > 0) && <span className="mt-1 block text-xs">Tente limpar a busca ou os filtros.</span>}</span>}
        className="[&_td]:border-r [&_td]:border-foreground/6 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-foreground/6 [&_th:last-child]:border-r-0 [&_tr]:border-foreground/6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10 pl-3">
                  <Checkbox checked={allPageSelected} aria-label="Selecionar página"
                    onCheckedChange={(v) => setSelected((s) => { const n = new Set(s); pg.visible.forEach((r) => (v ? n.add(rowId(r)) : n.delete(rowId(r)))); return n })} />
                </TableHead>
              )}
              {visibleCols.map((c) => (
                <TableHead key={c.id} className={cn("px-2", c.align === "right" && "text-right", c.className)}>
                  <ColumnMenu col={c} rows={rows} sort={sort} setSort={setSort} filter={filters[c.id] ?? []}
                    setFilter={(v) => setFilters((f) => ({ ...f, [c.id]: v }))} hide={c.fixed ? undefined : () => setHiddenCols((h) => [...h, c.id])} />
                </TableHead>
              ))}
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
          {total && filtered.length > 0 && totalColIndex >= 0 && (
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                {selectable && <TableCell />}
                {visibleCols.map((c, i) => (
                  <TableCell key={c.id} className={cn("px-3 font-medium", c.align === "right" && "text-right")}>
                    {i === 0 && i !== totalColIndex ? total.label : i === totalColIndex ? total.value(filtered) : null}
                  </TableCell>
                ))}
                {rowActions && <TableCell />}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableScroll>
      <TablePager p={pg} label={props.label} />
    </div>
  )
}

function ColumnMenu<T>({ col, rows, sort, setSort, filter, setFilter, hide }: {
  col: Column<T>; rows: T[]; sort: { id: string; dir: 1 | -1 } | null; setSort: (s: { id: string; dir: 1 | -1 } | null) => void
  filter: string[]; setFilter: (v: string[]) => void; hide?: () => void
}) {
  const values = useMemo(() => {
    if (!col.filterValue) return []
    const m = new Map<string, number>()
    rows.forEach((r) => { const v = col.filterValue!(r); m.set(v, (m.get(v) ?? 0) + 1) })
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  }, [rows, col])
  const sorted = sort?.id === col.id ? sort.dir : 0
  const interactive = col.sortValue || col.filterValue || hide
  if (!interactive) return <span className="px-1 font-medium">{col.header}</span>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <button className={cn("group/col inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 font-medium transition-colors hover:bg-foreground/5 hover:text-foreground data-popup-open:bg-foreground/5",
          col.align === "right" && "flex-row-reverse", (sorted || filter.length) && "text-foreground")} />
      }>
        {col.header}
        {filter.length > 0 && <span className="size-1.5 rounded-full bg-brand" />}
        {sorted === 1 ? <ArrowUp className="size-3.5 text-brand" /> : sorted === -1 ? <ArrowDown className="size-3.5 text-brand" /> : <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover/col:opacity-50" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={col.align === "right" ? "end" : "start"} className="w-52">
        {col.sortValue && (
          <>
            <DropdownMenuItem onClick={() => setSort({ id: col.id, dir: 1 })}><ArrowUp /> Crescente</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSort({ id: col.id, dir: -1 })}><ArrowDown /> Decrescente</DropdownMenuItem>
            {sorted !== 0 && <DropdownMenuItem onClick={() => setSort(null)}><X /> Sem ordenação</DropdownMenuItem>}
          </>
        )}
        {col.filterValue && values.length > 0 && (
          <>
            {col.sortValue && <DropdownMenuSeparator />}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><Filter /> Filtrar {filter.length > 0 && <span className="ml-auto text-xs text-brand">{filter.length}</span>}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto">
                {values.map(([v, n]) => (
                  <DropdownMenuCheckboxItem key={v} checked={filter.includes(v)}
                    onCheckedChange={(on) => setFilter(on ? [...filter, v] : filter.filter((x) => x !== v))}>
                    <span className="truncate">{v || "—"}</span><span className="ml-auto pl-2 text-xs text-muted-foreground">{n}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                {filter.length > 0 && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setFilter([])}><X /> Limpar filtro</DropdownMenuItem></>)}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        {hide && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={hide}><EyeOff /> Ocultar coluna</DropdownMenuItem></>)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
