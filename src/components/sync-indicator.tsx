import { useState } from "react"
import { toast } from "sonner"
import { Cloud, CloudOff, ExternalLink, Loader2, LogOut, RefreshCw, TriangleAlert, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
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
      try { await signIn(); toast.success("Conectado ao Google", { description: "Seus dados agora ficam salvos na sua conta." }) }
      catch (e) { toast.error((e as Error).message) }
      finally { setBusy(false) }
    }}>
      {busy ? <Loader2 className="animate-spin" /> : <GoogleIcon className="size-4" />} {label}
    </Button>
  )
}

export function SyncIndicator() {
  const { user, status, dirty, error, fileUrl, lastSyncAt, conflict } = useSync()
  const isDemo = useStore((s) => s.isDemo)
  if (!googleEnabled() || isDemo) return null
  if (!user) return <GoogleSignInButton size="sm" label="Entrar" className="hidden sm:inline-flex" />

  const Icon = status === "offline" ? CloudOff : status === "syncing" || status === "connecting" ? Loader2 : status === "error" || status === "conflict" || status === "needs-auth" ? TriangleAlert : Cloud
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2 px-1.5" aria-label={LABEL[status]} />}>
          <span className="relative">
            {user.picture
              ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-6 rounded-full" />
              : <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">{user.name[0]}</span>}
            <span className="absolute -right-0.5 -bottom-0.5"><SyncDot status={status} dirty={dirty} /></span>
          </span>
          <Icon className={cn("hidden size-4 text-muted-foreground md:block", status === "syncing" && "animate-spin")} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-foreground">
              <div className="font-medium">{user.name}</div>
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <div className="mx-1.5 mb-1 flex items-start gap-2 rounded-md bg-muted/60 p-2 text-xs">
            <SyncDot status={status} dirty={dirty} />
            <div>
              <div className="font-medium">{dirty && status === "synced" ? "Alterações aguardando envio" : LABEL[status]}</div>
              {error && status === "error" && <div className="text-muted-foreground">{error}</div>}
              {lastSyncAt && <div className="text-muted-foreground">Última sincronização: {new Date(lastSyncAt).toLocaleString("pt-BR")}</div>}
            </div>
          </div>
          <DropdownMenuSeparator />
          {status === "needs-auth"
            ? <DropdownMenuItem onClick={() => void reconnect()}><RefreshCw /> Reconectar</DropdownMenuItem>
            : <DropdownMenuItem onClick={() => void syncNow().then(() => useSync.getState().status === "synced" && toast.success("Sincronizado"))}><RefreshCw /> Sincronizar agora</DropdownMenuItem>}
          {fileUrl && <DropdownMenuItem onClick={() => window.open(fileUrl, "_blank", "noopener")}><ExternalLink /> Abrir planilha de dados</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => { signOut(true); toast("Você saiu da conta", { description: "Os dados continuam salvos no seu Google." }) }}>
            <LogOut /> Sair da conta
          </DropdownMenuItem>
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
