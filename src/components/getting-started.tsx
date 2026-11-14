import { useRef, useState } from "react"
import { toast } from "sonner"
import { Check, CloudCheck, FileUp, Plus, Sheet as SheetIcon, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SheetImportDialog } from "@/components/sheet-import-dialog"
import { AppLogo } from "@/components/app-logo"
import { useStore } from "@/lib/store"
import { useSync } from "@/lib/sync"
import { readBackup } from "@/lib/backup"
import { money, monthLabel, parseMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Primeiros passos: aparece dentro do app quando ainda não há lançamentos */
export function GettingStarted({ month, onAdd }: { month: string; onAdd: () => void }) {
  const { settings, months, setSalary, updateSettings, importBackup } = useStore()
  const user = useSync((s) => s.user)
  const salary = months.find((m) => m.id === month)?.salary ?? 0
  const [value, setValue] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function saveSalary(e: React.FormEvent) {
    e.preventDefault()
    const v = parseMoney(value)
    if (!v) return toast.error("Informe um valor.")
    setSalary(month, v)
    updateSettings({ defaultSalary: v })
    setValue("")
    toast.success(`Renda definida: ${money(v)}`)
  }
  async function onFile(f?: File) {
    if (!f) return
    try { const b = await readBackup(f); importBackup(b); toast.success("Backup restaurado") }
    catch (e) { toast.error((e as Error).message) }
  }

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl p-6 glass sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand/20 blur-[90px]" />
      <div className="relative">
        <AppLogo className="size-12" />
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">Bem-vindo{settings.ownerName ? `, ${settings.ownerName}` : ""}!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user
            ? <span className="inline-flex items-center gap-1.5"><CloudCheck className="size-4 text-brand" /> Conectado como {user.email}. Tudo o que você fizer é salvo na sua conta.</span>
            : "Três passos rápidos para deixar tudo pronto."}
        </p>

        <ol className="mt-6 grid gap-3">
          <Step n={1} done={salary > 0} icon={Wallet} title="Defina sua renda mensal" desc={salary > 0 ? `${money(salary)} em ${monthLabel(month)}` : "Base para calcular saldo e comprometimento."}>
            {salary === 0 && (
              <form onSubmit={saveSalary} className="flex gap-2">
                <Input className="num h-9 w-36" inputMode="decimal" placeholder="R$ 0,00" value={value} onChange={(e) => setValue(e.target.value)} />
                <Button type="submit" size="sm" className="h-9 bg-brand text-brand-foreground hover:bg-brand/90">Salvar</Button>
              </form>
            )}
          </Step>
          <Step n={2} icon={SheetIcon} title="Traga seus dados" desc="Importe a planilha que você já usa ou restaure um backup.">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-9 glass-subtle" onClick={() => setSheetOpen(true)}><SheetIcon /> Importar planilha</Button>
              <Button size="sm" variant="ghost" className="h-9" onClick={() => fileRef.current?.click()}><FileUp /> Backup</Button>
            </div>
          </Step>
          <Step n={3} icon={Plus} title="Ou comece lançando" desc="Adicione seu primeiro gasto: fixo, parcelado ou à vista.">
            <Button size="sm" className="h-9" onClick={onAdd}><Plus /> Novo gasto</Button>
          </Step>
        </ol>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = "" }} />
      <SheetImportDialog open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

function Step({ n, done, icon: Icon, title, desc, children }: {
  n: number; done?: boolean; icon: typeof Wallet; title: string; desc: string; children?: React.ReactNode
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-foreground/8 bg-foreground/[0.02] p-4 sm:flex-row sm:items-center">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        done ? "bg-success/15 text-success" : "bg-brand/12 text-brand")}>
        {done ? <Check className="size-4" /> : <Icon className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium"><span className="text-muted-foreground">{n}.</span> {title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </li>
  )
}
