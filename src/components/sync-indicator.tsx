import { useEffect, useState } from "react"
import { COVER_CSS } from "@/lib/covers"
import { toast } from "sonner"
import { Check, Cloud, CloudCheck, CloudOff, Loader2, LogOut, RefreshCw, Sheet, TriangleAlert, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GoogleIcon } from "@/components/google-icon"
import { googleEnabled } from "@/lib/config"
import { reconnect, resolveConflict, signIn, signOut, syncNow, useSync, type SyncStatus } from "@/lib/sync"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const LABEL: Record<SyncStatus, string> = {
  off: "Não conectado",
  connecting: "Conectando…",
  syncing: "Salvando no Google…",
  synced: "Tudo salvo no Google",
  offline: "Offline · salva quando a internet voltar",
  "needs-auth": "Sessão expirou · toque para reconectar",
  "needs-scope": "Falta a permissão do Google Drive",
  error: "Erro ao sincronizar",
  conflict: "Conflito entre aparelhos",
}

export function SyncDot({ status, dirty }: { status: SyncStatus; dirty: boolean }) {
  const cls = status === "synced" && !dirty ? "bg-success"
    : status === "error" || status === "conflict" ? "bg-critical"
    : status === "syncing" || status === "connecting" ? "bg-chart-1 animate-pulse"
    : "bg-warning"
  return <span className={cn("size-2.5 rounded-full ring-2 ring-background", cls)} />
}

export function GoogleSignInButton({ className, label = "Entrar com Google", size }: { className?: string; label?: string; size?: "sm" | "default" | "lg" }) {
  const [busy, setBusy] = useState(false)
  return (
    <Button variant="outline" size={size} className={cn("gap-2", className)} disabled={busy} onClick={async () => {
      setBusy(true)
      try { await signIn({ chooseAccount: true }); toast.success("Conectado ao Google", { description: "Seus dados agora ficam salvos na sua conta." }) }
      catch (e) { toast.error((e as Error).message) }
      finally { setBusy(false) }
    }}>
      {busy ? <Loader2 className="animate-spin" /> : <GoogleIcon className="size-4" />} {label}
    </Button>
  )
}

const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" })
function ago(iso: string | null) {
  if (!iso) return "ainda não sincronizado"
  const sec = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  if (sec > -45) return "agora mesmo"
  const min = Math.round(sec / 60)
  if (min > -60) return rtf.format(min, "minute")
  const h = Math.round(min / 60)
  return h > -24 ? rtf.format(h, "hour") : new Date(iso).toLocaleString("pt-BR")
}

const RING: Record<SyncStatus, string> = {
  off: "ring-foreground/20", connecting: "ring-brand", syncing: "ring-brand", synced: "ring-success",
  offline: "ring-warning", "needs-auth": "ring-warning", "needs-scope": "ring-warning", error: "ring-critical", conflict: "ring-critical",
}

export function SyncIndicator() {
  const { user, status, dirty, error, fileUrl, lastSyncAt, conflict } = useSync()
  const isDemo = useStore((s) => s.isDemo)
  const counts = { n: useStore((s) => s.expenses.length), m: useStore((s) => s.months.length) }
  const cover = useStore((s) => s.settings.cover)
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30_000); return () => clearInterval(t) }, [])
  if (!googleEnabled() || isDemo) return null
  if (!user) return <GoogleSignInButton size="sm" label="Entrar" className="hidden sm:inline-flex" />

  const busy = status === "syncing" || status === "connecting"
  const ok = status === "synced" && !dirty
  const bad = status === "error" || status === "conflict" || status === "needs-auth" || status === "needs-scope"
  const Big = status === "offline" ? CloudOff : busy ? Loader2 : bad ? TriangleAlert : CloudCheck
  const title = dirty && status === "synced" ? "Alterações aguardando envio" : LABEL[status]
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button className="relative rounded-full p-0.5 transition active:scale-95" aria-label={title} />}>
          {user.picture
            ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className={cn("size-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition-[box-shadow]", RING[status], busy && "animate-pulse")} />
            : <span className={cn("flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-offset-2 ring-offset-background", RING[status])}>{user.name[0]}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-80 overflow-hidden p-0">
          {/* topo com a capa do perfil */}
          <div className="relative h-14" style={{ background: COVER_CSS[cover ?? "blue"] ?? COVER_CSS.blue }}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),transparent)]" />
          </div>
          <div className="-mt-7 flex items-end gap-3 px-4">
            {user.picture
              ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-14 rounded-full ring-4 ring-popover" />
              : <span className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold ring-4 ring-popover">{user.name[0]}</span>}
            <div className="min-w-0 pb-1">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>

          {/* status */}
          <div className={cn("mx-3 mt-4 flex items-center gap-3 rounded-2xl p-3 ring-1",
            ok ? "bg-success/8 ring-success/20" : bad ? "bg-critical/8 ring-critical/20" : status === "offline" ? "bg-warning/8 ring-warning/20" : "bg-brand/8 ring-brand/20")}>
            <span className={cn("relative flex size-10 shrink-0 items-center justify-center rounded-full",
              ok ? "bg-success/15 text-success" : bad ? "bg-critical/15 text-critical" : status === "offline" ? "bg-warning/15 text-warning" : "bg-brand/15 text-brand")}>
              {ok && <span className="absolute inset-0 animate-ping rounded-full bg-success/20 [animation-duration:2.4s]" />}
              <Big className={cn("relative size-5", busy && "animate-spin")} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">{title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {status === "error" && error ? error : `Sincronizado ${ago(lastSyncAt)}`}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{counts.n} lançamentos · {counts.m} meses</div>
            </div>
          </div>

          {/* ações */}
          <div className="grid grid-cols-2 gap-2 p-3">
            <button onClick={() => status === "needs-scope" ? void grantDrive() : status === "needs-auth" ? void reconnect() : void syncNow().then(() => useSync.getState().status === "synced" && toast.success("Tudo sincronizado"))}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-foreground/[0.04] p-3 text-xs font-medium ring-1 ring-foreground/8 transition hover:bg-brand/10 hover:ring-brand/30 active:scale-[0.97]">
              <RefreshCw className={cn("size-4 text-brand", busy && "animate-spin")} />
              {status === "needs-scope" ? "Conceder acesso" : status === "needs-auth" ? "Reconectar" : "Sincronizar"}
            </button>
            <button disabled={!fileUrl} onClick={() => fileUrl && window.open(fileUrl, "_blank", "noopener")}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-foreground/[0.04] p-3 text-xs font-medium ring-1 ring-foreground/8 transition hover:bg-brand/10 hover:ring-brand/30 active:scale-[0.97] disabled:opacity-50">
              <Sheet className="size-4 text-success" /> Abrir planilha
            </button>
          </div>

          <DropdownMenuSeparator className="my-0" />
          <div className="p-1.5">
            <DropdownMenuItem onClick={() => { window.location.hash = "/conta" }}><UserRound /> Minha conta</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => { signOut(true); toast("Você saiu da conta", { description: "Os dados continuam salvos no seu Google." }) }}>
              <LogOut /> Sair da conta
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!conflict} onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Dados diferentes em dois aparelhos</DialogTitle>
            <DialogDescription>
              Você fez alterações aqui enquanto os dados também mudaram em outro aparelho. Qual versão deseja manter?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <div className="rounded-lg bg-muted/60 p-3"><b>Deste aparelho:</b> {useStore.getState().expenses.length} lançamentos</div>
            <div className="rounded-lg bg-muted/60 p-3"><b>Do Google (outro aparelho):</b> {conflict?.expenses.length ?? 0} lançamentos</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => void resolveConflict("remote")}><Cloud /> Usar a do Google</Button>
            <Button onClick={() => void resolveConflict("local")}><Check /> Manter a deste aparelho</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Pede de novo a permissão do Drive e sincroniza (puxa os dados do Google) */
export async function grantDrive() {
  try {
    await signIn({ consent: true })
    toast.success("Acesso ao Drive concedido", { description: "Seus dados foram sincronizados." })
  } catch (e) { toast.error((e as Error).message) }
}

/** Faixa no topo do app quando a sincronização precisa de ação */
export function SyncAlert() {
  const { status, error, user } = useSync()
  const [busy, setBusy] = useState(false)
  if (!user || (status !== "needs-scope" && status !== "error")) return null
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-3 border-b border-warning/25 bg-warning/10 px-4 py-2.5 text-sm md:px-6">
      <TriangleAlert className="size-4 shrink-0 text-warning" />
      <div className="min-w-0 flex-1">
        <span className="font-medium">{status === "needs-scope" ? "Seus dados não estão sendo salvos no Google." : "Não foi possível sincronizar."}</span>{" "}
        <span className="text-muted-foreground">{status === "needs-scope" ? "Falta a permissão do Google Drive." : error}</span>
      </div>
      <Button size="sm" disabled={busy} className="bg-brand text-brand-foreground hover:bg-brand/90"
        onClick={async () => { setBusy(true); try { status === "needs-scope" ? await grantDrive() : await syncNow() } finally { setBusy(false) } }}>
        {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} {status === "needs-scope" ? "Conceder acesso" : "Tentar de novo"}
      </Button>
    </div>
  )
}
