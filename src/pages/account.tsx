import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Camera, Check, ExternalLink, KeyRound, LifeBuoy, LogOut, RefreshCw, ShieldCheck, Trash2, Unlink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/field-label"
import { CurrencyField } from "@/components/currency-field"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { UserAvatar, useProfile } from "@/components/user-avatar"
import { GoogleIcon } from "@/components/google-icon"
import { GoogleSignInButton, SyncDot, grantDrive } from "@/components/sync-indicator"
import { SignOutDialog } from "@/components/sign-out-dialog"
import { useStore } from "@/lib/store"
import { signOut, syncNow, useSync } from "@/lib/sync"
import { googleEnabled } from "@/lib/config"
import { resizeImage } from "@/lib/image"

const COVERS = [
  { id: "blue", name: "Blue Period", css: "linear-gradient(120deg,#2557C7,#3B82F6 45%,#7DD3FC)" },
  { id: "aurora", name: "Aurora", css: "linear-gradient(120deg,#3B82F6,#34D399 55%,#9BE858)" },
  { id: "dusk", name: "Crepúsculo", css: "linear-gradient(120deg,#6D28D9,#A78BFA 50%,#FF8E56)" },
  { id: "sunset", name: "Outono", css: "linear-gradient(120deg,#FF8E56,#F4607A 60%,#A78BFA)" },
  { id: "night", name: "Noite", css: "linear-gradient(120deg,#0F172A,#101827 50%,#3B82F6)" },
]

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
    <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
      {/* Cabeçalho do perfil */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="group/cover relative h-28 sm:h-32" style={{ background: COVERS.find((c) => c.id === settings.cover)?.css ?? COVERS[0].css }}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_60%)]" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/25 p-1.5 opacity-0 backdrop-blur-md transition-opacity group-hover/cover:opacity-100 focus-within:opacity-100">
            {COVERS.map((c) => (
              <button key={c.id} onClick={() => updateSettings({ cover: c.id })} aria-label={`Capa ${c.name}`} title={c.name}
                className={`size-5 rounded-full ring-2 transition ${ (settings.cover ?? COVERS[0].id) === c.id ? "ring-white" : "ring-white/0 hover:ring-white/60"}`}
                style={{ background: c.css }} />
            ))}
          </div>
        </div>
        <CardContent className="flex flex-col items-center gap-4 pb-6 sm:flex-row sm:items-end">
          <div className="group relative -mt-12 shrink-0">
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
          <div className="min-w-0 flex-1 pt-1 text-center sm:pt-4 sm:text-left">
            <h2 className="truncate text-xl font-semibold tracking-tight">{p.fullName}</h2>
            <p className="truncate text-sm text-muted-foreground">{p.email || "Nenhum e-mail vinculado"}</p>
            {p.google && <Badge variant="secondary" className="mt-2 gap-1"><GoogleIcon className="size-3" /> Conta Google</Badge>}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Camera /> Alterar foto</Button>
            {settings.photo && p.googlePhoto && <Button size="sm" variant="ghost" onClick={() => updateSettings({ photo: undefined })}>Usar foto do Google</Button>}
            {settings.photo && !p.googlePhoto && <Button size="sm" variant="ghost" onClick={() => updateSettings({ photo: undefined })}>Remover</Button>}
          </div>
        </CardContent>
        <p className="border-t border-foreground/6 px-5 py-2 text-center text-[11px] text-muted-foreground sm:text-left">Dica: passe o mouse na capa para escolher outra cor.</p>
      </Card>

      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Como você aparece no app.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="acc-first" required>Nome</FieldLabel>
            <Input id="acc-first" value={first} onChange={(e) => setFirst(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="acc-last" optional>Sobrenome</FieldLabel>
            <Input id="acc-last" value={last} onChange={(e) => setLast(e.target.value)} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <FieldLabel htmlFor="acc-email" optional={!p.google}>E-mail</FieldLabel>
            <Input id="acc-email" type="email" value={p.google ? p.email : email} disabled={p.google} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            {p.google && <p className="text-xs text-muted-foreground">Vem da sua conta Google e só pode ser alterado lá.</p>}
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button onClick={save} disabled={!changed}><Check /> Salvar alterações</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>Moeda usada em todo o app e na sua planilha.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 sm:max-w-sm">
          <FieldLabel required>Moeda</FieldLabel>
          <CurrencyField />
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
                    <div className="font-medium">{sync.status === "synced" && !sync.dirty ? "Tudo salvo no Google" : sync.status === "offline" ? "Offline · salva quando a internet voltar" : sync.status === "needs-auth" ? "Sessão expirada · toque em Sincronizar" : sync.status === "needs-scope" ? "Falta a permissão do Google Drive" : sync.status === "error" ? sync.error : "Sincronizando…"}</div>
                    {sync.lastSyncAt && <div className="text-xs text-muted-foreground">Última sincronização: {new Date(sync.lastSyncAt).toLocaleString("pt-BR")}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sync.status === "needs-scope"
                    ? <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => void grantDrive()}><RefreshCw /> Conceder acesso ao Drive</Button>
                    : <Button variant="outline" onClick={() => void syncNow()}><RefreshCw /> Sincronizar agora</Button>}
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
            O Finitree não guarda senhas. O acesso é feito pela sua conta Google, protegida pela senha e pela verificação em duas etapas do próprio Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          <SecurityLink icon={KeyRound} title="Alterar senha" desc="Troque a senha da sua conta Google" href="https://myaccount.google.com/signinoptions/password" />
          <SecurityLink icon={LifeBuoy} title="Esqueci a senha" desc="Recupere o acesso à conta Google" href="https://accounts.google.com/signin/recovery" />
          <SecurityLink icon={ShieldCheck} title="Acessos do app" desc="Veja ou revogue o acesso do Finitree" href="https://myaccount.google.com/permissions" />
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
                  {p.google ? "A planilha no seu Google Drive não é apagada: para excluí-la de vez, apague o arquivo “Finitree — dados” no Drive." : "Sem conta Google conectada, isso não pode ser desfeito."}
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
