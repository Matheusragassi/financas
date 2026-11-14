import { useRef, useState } from "react"
import { toast } from "sonner"
import { FileUp, Sparkles, Wallet, PlusCircle, ShieldCheck, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { readBackup } from "@/lib/backup"
import { demoBackup } from "@/lib/demo"
import { currentMonthId, parseMoney } from "@/lib/format"
import { ThemeToggle } from "@/components/theme-toggle"

export function Onboarding() {
  const { importBackup, startEmpty } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState("")
  const [salary, setSalary] = useState("")

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

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileUp className="size-4" /> Importar backup</CardTitle>
              <CardDescription>Carregue um arquivo .json exportado por este app.</CardDescription>
            </CardHeader>
            <CardContent>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <Button className="w-full" onClick={() => fileRef.current?.click()}>Escolher arquivo</Button>
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
              <Button variant="outline" className="w-full" onClick={() => importBackup(demoBackup())}>Ver demonstração</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
