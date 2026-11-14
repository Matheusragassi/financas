import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CreditCard as CardIcon, Link2, MoreHorizontal, Pencil, Plus, Trash2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SimpleSelect } from "@/components/simple-select"
import { CardVisual } from "@/components/card-visual"
import { CardDialog } from "@/components/card-dialog"
import { BarList, Meter } from "@/components/charts"
import { StatCard } from "@/components/stat-card"
import { useStore } from "@/lib/store"
import { useSelectedMonth } from "@/lib/use-month"
import { cardStats, isCreditMethod } from "@/lib/cards"
import { money, monthLabel, percent } from "@/lib/format"
import type { CreditCard } from "@/lib/types"

export function CardsPage() {
  const { expenses, settings, assignCard, removeCard } = useStore()
  const cards = settings.cards ?? []
  const month = useSelectedMonth()
  const [editing, setEditing] = useState<CreditCard | null>(null)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<CreditCard | null>(null)
  const [target, setTarget] = useState("")

  const stats = useMemo(() => cardStats(expenses, cards, month), [expenses, cards, month])
  const unlinked = useMemo(() => expenses.filter((e) => isCreditMethod(e.method) && (!e.cardId || !cards.some((c) => c.id === e.cardId))), [expenses, cards])
  const linkTarget = target || cards[0]?.id || ""
  const totalOwed = stats.reduce((a, s) => a + s.owed, 0)
  const totalMonth = stats.reduce((a, s) => a + s.month, 0)
  const top = stats.filter((s) => s.card).sort((a, b) => b.owed - a.owed)[0]

  function linkAll() {
    const n = assignCard(unlinked.map((e) => e.id), linkTarget)
    toast.success(`${n} gastos vinculados a ${cards.find((c) => c.id === linkTarget)?.name}`)
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Cartões de crédito em</p>
          <h2 className="text-2xl font-semibold tracking-tight">{monthLabel(month)}</h2>
        </div>
        <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setCreating(true)}><Plus /> Novo cartão</Button>
      </div>

      {cards.length === 0 ? (
        <Card className="mx-auto max-w-xl text-center">
          <CardContent className="flex flex-col items-center gap-3 py-6">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/12 text-brand"><CardIcon className="size-6" /></span>
            <div>
              <h3 className="text-lg font-semibold">Cadastre seus cartões</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Informe só o banco (e a bandeira, se quiser). Assim você vê quanto deve em cada cartão e qual está usando mais.
              </p>
            </div>
            {unlinked.length > 0 && <p className="text-xs text-muted-foreground">Você tem <b>{unlinked.length}</b> gastos no crédito esperando um cartão.</p>}
            <Button className="mt-1 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setCreating(true)}><Plus /> Adicionar primeiro cartão</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {unlinked.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/8 p-4 sm:flex-row sm:items-center">
              <Link2 className="size-5 shrink-0 text-brand" />
              <div className="flex-1 text-sm">
                <b>{unlinked.length} gastos no crédito</b> ainda não estão ligados a um cartão.
                <span className="block text-xs text-muted-foreground">Se todos são do mesmo cartão, vincule de uma vez. Dá para ajustar um a um em Lançamentos.</span>
              </div>
              <div className="flex gap-2">
                {cards.length > 1 && <SimpleSelect className="w-44" value={linkTarget} onChange={setTarget} options={cards.map((c) => ({ value: c.id, label: c.name }))} />}
                <Button onClick={linkAll}>Vincular {cards.length === 1 ? `ao ${cards[0].name}` : "todos"}</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatCard label="Faturas do mês" value={money(totalMonth)} icon={CardIcon} hint={`${cards.length} ${cards.length === 1 ? "cartão" : "cartões"}`} />
            <StatCard label="Total devido" value={money(totalOwed)} icon={Wallet} hint="Mês atual + parcelas futuras" />
            <StatCard label="Mais usado" value={top?.card?.name ?? "—"} hint={top ? `${money(top.owed)} devidos` : ""} />
            <StatCard label="Parcelas futuras" value={money(stats.reduce((a, s) => a + s.future, 0))} hint="Ainda vão cair nas próximas faturas" />
          </div>

          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stats.filter((s) => s.card).map((s) => (
              <div key={s.card!.id} className="space-y-3 rounded-3xl border border-foreground/8 bg-card p-3">
                <CardVisual card={s.card!}>
                  <div className="text-[11px] opacity-80">Fatura de {monthLabel(month).split(" ")[0].toLowerCase()}</div>
                  <div className="num text-xl font-semibold">{money(s.month)}</div>
                </CardVisual>
                <div className="space-y-2 px-1 pb-1 text-sm">
                  <Row label="Parcelas futuras" value={money(s.future)} />
                  <Row label="Total devido" value={money(s.owed)} strong />
                  {s.card!.limit ? (
                    <div className="space-y-1">
                      <Row label="Limite comprometido" value={`${percent(s.limitUse ?? 0)} de ${money(s.card!.limit)}`} />
                      <Meter value={s.limitUse ?? 0} />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>{s.count} lançamentos{s.card!.dueDay ? ` · vence dia ${s.card!.dueDay}` : ""}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Ações do cartão" />}><MoreHorizontal /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(s.card)}><Pencil /> Editar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setRemoving(s.card)}><Trash2 /> Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Onde você deve mais</CardTitle>
              <CardDescription>Total devido por cartão: fatura de {monthLabel(month)} + parcelas que ainda vão cair</CardDescription>
            </CardHeader>
            <CardContent>
              <BarList total={totalOwed} data={stats.map((s) => ({ name: s.card?.name ?? "Crédito sem cartão", value: s.owed, color: s.card?.color ?? "var(--muted-foreground)" }))} />
            </CardContent>
          </Card>
        </>
      )}

      <CardDialog open={creating || !!editing} card={editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null) } }} />
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Os gastos continuam no app, só deixam de estar ligados a este cartão.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => { removeCard(removing!.id); setRemoving(null) }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "num font-semibold" : "num"}>{value}</span>
    </div>
  )
}
