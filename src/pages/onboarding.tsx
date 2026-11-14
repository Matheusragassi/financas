import { useRef, useState } from "react"
import { toast } from "sonner"
import { FileUp, Sparkles, Wallet, PlusCircle, ShieldCheck, WifiOff, Sheet as SheetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { readBackup } from "@/lib/backup"
import { demoBackup } from "@/lib/demo"
import { currentMonthId, parseMoney } from "@/lib/format"
import { ThemeToggle } from "@/components/theme-toggle"
import { SheetImportDialog } from "@/components/sheet-import-dialog"
import { AuthorCredit } from "@/components/author-credit"
import { GoogleSignInButton } from "@/components/sync-indicator"
import { googleEnabled } from "@/lib/config"
import { signOut, useSync } from "@/lib/sync"
import { Cloud } from "lucide-react"

export function Onboarding() {
  const { importBackup, startEmpty } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [salary, setSalary] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const user = useSync((s) => s.user)

  async function onFile(f?: File) {
    if (!f) return
    try {
      const b = await readBackup(f)
      importBackup(b)
      toast.success("Dados importados", { description: `${b.expenses.length} lançamentos em ${b.months.length} meses` })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_60%)] p-4">
      <div className="absolute top-3 right-3"><ThemeToggle /></div>
      <div className="w-full max-w-3xl space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet className="size-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Finanças</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Controle seus gastos mês a mês, acompanhe parcelas e veja para onde vai o seu dinheiro.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><WifiOff className="size-3.5" /> Funciona offline</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Dados só no seu aparelho</span>
          </div>
        </div>

        {googleEnabled() && (user ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 text-sm">
            {user.picture && <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full" />}
            <div className="flex-1">
              <div className="font-medium">Conectado como {user.name}</div>
              <div className="text-xs text-muted-foreground">Escolha abaixo como começar. Tudo fica salvo automaticamente na sua conta Google.</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut(false)}>Trocar conta</Button>
          </div>
        ) : (
          <Card className="ring-2 ring-primary/25">
            <CardContent className="flex flex-col items-center gap-3 py-2 text-center sm:flex-row sm:text-left">
              <Cloud className="size-8 shrink-0 text-chart-1" />
              <div className="flex-1">
                <div className="font-medium">Entre com sua conta Google</div>
                <div className="text-sm text-muted-foreground">Seus dados ficam salvos no seu Google Drive e aparecem no celular e no computador. Sem backup manual.</div>
              </div>
              <GoogleSignInButton size="lg" className="w-full sm:w-auto" />
            </CardContent>
          </Card>
        ))}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="ring-2 ring-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SheetIcon className="size-4" /> Importar do Google Planilhas</CardTitle>
              <CardDescription>Cole o link da sua planilha de gastos e o app lê todos os meses.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setSheetOpen(true)}>Colar link da planilha</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileUp className="size-4" /> Importar backup</CardTitle>
              <CardDescription>Carregue um arquivo .json exportado por este app.</CardDescription>
            </CardHeader>
            <CardContent>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>Escolher arquivo</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PlusCircle className="size-4" /> Começar do zero</CardTitle>
              <CardDescription>Informe seu nome e sua renda mensal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ob-name">Nome</Label>
                <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ob-sal">Renda mensal</Label>
                <Input id="ob-sal" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="R$ 0,00" />
              </div>
              <Button variant="secondary" className="w-full" onClick={() => startEmpty(parseMoney(salary), name.trim(), currentMonthId())}>
                Começar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="size-4" /> Explorar demo</CardTitle>
              <CardDescription>12 meses de dados fictícios para conhecer o app.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => importBackup(demoBackup(), { demo: true })}>Ver demonstração</Button>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col items-center gap-2">
          <AuthorCredit className="justify-center" />
          <a href="./privacidade.html" className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">Política de privacidade</a>
        </div>
      </div>
      <SheetImportDialog open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
