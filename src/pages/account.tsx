import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Camera, Check, ExternalLink, KeyRound, LifeBuoy, LogOut, RefreshCw, ShieldCheck, Trash2, Unlink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UserAvatar, useProfile } from "@/components/user-avatar"
import { GoogleIcon } from "@/components/google-icon"
import { GoogleSignInButton, SyncDot } from "@/components/sync-indicator"
import { SignOutDialog } from "@/components/sign-out-dialog"
import { useStore } from "@/lib/store"
import { signOut, syncNow, useSync } from "@/lib/sync"
import { googleEnabled } from "@/lib/config"
import { resizeImage } from "@/lib/image"

export function AccountPage() {
  const p = useProfile()
  const { updateSettings, settings, resetAll } = useStore()
  const sync = useSync()
  const fileRef = useRef<HTMLInputElement>(null)
  const [first, setFirst] = useState(p.first)
  const [last, setLast] = useState(p.last)
  const [email, setEmail] = useState(settings.email ?? "")
  const [leaving, setLeaving] = useState(false)
  useEffect(() => { setFirst(p.first); setLast(p.last) }, [p.first, p.last])

  const changed = first.trim() !== p.first || last.trim() !== p.last || (!p.google && email.trim() !== (settings.email ?? ""))
  const save = () => {
    if (!first.trim()) return toast.error("Informe seu nome.")
    updateSettings({ ownerName: first.trim(), lastName: last.trim(), ...(!p.google && { email: email.trim() }) })
    toast.success("Perfil atualizado")
  }
  async function onPhoto(f?: File) {
    if (!f) return
    try { updateSettings({ photo: await resizeImage(f) }); toast.success("Foto atualizada") }
    catch (e) { toast.error((e as Error).message) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
      {/* Cabeçalho do perfil */}
      <Card className="overflow-hidden pt-0">
        <div className="h-24 bg-[linear-gradient(120deg,var(--chart-1),var(--chart-7)_55%,var(--chart-5))] opacity-80" />
        <CardContent className="-mt-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:text-left">
          <div className="group relative">
            <UserAvatar className="size-24 text-2xl ring-4 ring-card" />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              aria-label="Alterar foto"
            >
              <Camera className="size-6" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = "" }} />
          </div>
          <div className="flex-1 sm:pb-1">
            <h2 className="text-xl font-semibold tracking-tight">{p.fullName}</h2>
            <p className="text-sm text-muted-foreground">{p.email || "Nenhum e-mail vinculado"}</p>
            {p.google && <Badge variant="secondary" className="mt-1.5 gap-1"><GoogleIcon className="size-3" /> Conta Google</Badge>}
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:pb-1">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Camera /> Alterar foto</Button>
            {settings.photo && p.googlePhoto && <Button size="sm" variant="ghost" onClick={() => updateSettings({ photo: undefined })}>Usar foto do Google</Button>}
            {settings.photo && !p.googlePhoto && <Button size="sm" variant="ghost" onClick={() => updateSettings({ photo: undefined })}>Remover</Button>}
          </div>
        </CardContent>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Como você aparece no app.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="acc-first">Nome</Label>
            <Input id="acc-first" value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="acc-last">Sobrenome</Label>
            <Input id="acc-last" value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="acc-email">E-mail</Label>
            <Input id="acc-email" type="email" value={p.google ? p.email : email} disabled={p.google} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            {p.google && <p className="text-xs text-muted-foreground">Vem da sua conta Google e só pode ser alterado lá.</p>}
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button onClick={save} disabled={!changed}><Check /> Salvar alterações</Button>
          </div>
        </CardContent>
      </Card>

      {/* Conta Google */}
      {googleEnabled() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GoogleIcon className="size-4" /> Vínculo com o Google</CardTitle>
            <CardDescription>
              {p.google
                ? "Seus dados são salvos automaticamente numa planilha no seu Google Drive e aparecem em qualquer aparelho em que você entrar."
                : "Conecte sua conta para salvar tudo automaticamente e acessar do celular e do computador."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {p.google ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3 text-sm">
                  <SyncDot status={sync.status} dirty={sync.dirty} />
                  <div className="flex-1">
                    <div className="font-medium">{sync.status === "synced" && !sync.dirty ? "Tudo salvo no Google" : sync.status === "offline" ? "Offline · salva quando a internet voltar" : sync.status === "needs-auth" ? "Sessão expirada · toque em Sincronizar" : sync.status === "error" ? sync.error : "Sincronizando…"}</div>
                    {sync.lastSyncAt && <div className="text-xs text-muted-foreground">Última sincronização: {new Date(sync.lastSyncAt).toLocaleString("pt-BR")}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => void syncNow()}><RefreshCw /> Sincronizar agora</Button>
                  {sync.fileUrl && <Button variant="outline" onClick={() => window.open(sync.fileUrl!, "_blank", "noopener")}><ExternalLink /> Abrir planilha de dados</Button>}
                  <AlertDialog>
                    <AlertDialogTrigger render={<Button variant="ghost" />}><Unlink /> Desvincular</AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desvincular a conta Google?</AlertDialogTitle>
                        <AlertDialogDescription>Os dados continuam neste aparelho e na planilha do seu Drive, mas deixam de ser sincronizados.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { signOut(false); toast("Conta Google desvinculada") }}>Desvincular</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : <GoogleSignInButton />}
          </CardContent>
        </Card>
      )}

      {/* Senha e segurança */}
      {googleEnabled() && <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Senha e segurança</CardTitle>
          <CardDescription>
            O Finanças não guarda senhas. O acesso é feito pela sua conta Google, protegida pela senha e pela verificação em duas etapas do próprio Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          <SecurityLink icon={KeyRound} title="Alterar senha" desc="Troque a senha da sua conta Google" href="https://myaccount.google.com/signinoptions/password" />
          <SecurityLink icon={LifeBuoy} title="Esqueci a senha" desc="Recupere o acesso à conta Google" href="https://accounts.google.com/signin/recovery" />
          <SecurityLink icon={ShieldCheck} title="Acessos do app" desc="Veja ou revogue o acesso do Finanças" href="https://myaccount.google.com/permissions" />
        </CardContent>
      </Card>}

      {/* Sessão */}
      <Card className="ring-destructive/25">
        <CardHeader>
          <CardTitle>Sessão</CardTitle>
          <CardDescription>Saia deste aparelho ou apague todos os dados dele.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setLeaving(true)}><LogOut /> Sair</Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}><Trash2 /> Apagar dados deste aparelho</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar todos os dados deste aparelho?</AlertDialogTitle>
                <AlertDialogDescription>
                  {p.google ? "A planilha no seu Google Drive não é apagada: para excluí-la de vez, apague o arquivo “Finanças — dados” no Drive." : "Sem conta Google conectada, isso não pode ser desfeito."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => { if (p.google) signOut(false); resetAll(); window.location.hash = "" }}>Apagar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
      <SignOutDialog open={leaving} onOpenChange={setLeaving} />
    </div>
  )
}

function SecurityLink({ icon: Icon, title, desc, href }: { icon: typeof KeyRound; title: string; desc: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="group flex flex-col gap-1 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/60">
      <span className="flex items-center gap-2 font-medium"><Icon className="size-4 text-muted-foreground" /> {title} <ExternalLink className="ml-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-60" /></span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </a>
  )
}
