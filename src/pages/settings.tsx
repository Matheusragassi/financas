import { useRef, useState } from "react"
import { toast } from "sonner"
import { Download, FileUp, Plus, RefreshCw, RotateCcw, Sheet as SheetIcon, Smartphone, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { InlineMoney } from "@/components/inline-money"
import { DataTable } from "@/components/data-table"
import { MoneyInput } from "@/components/money-input"
import { FieldLabel } from "@/components/field-label"
import { CurrencyField } from "@/components/currency-field"
import { useStore } from "@/lib/store"
import { downloadJson, readBackup } from "@/lib/backup"
import { money, monthLabel } from "@/lib/format"
import { useInstallPrompt } from "@/lib/use-install"
import { SheetImportDialog } from "@/components/sheet-import-dialog"


export function SettingsPage() {
  const s = useStore()
  const months = [...s.months].reverse()
  const fileRef = useRef<HTMLInputElement>(null)
  const install = useInstallPrompt()
  const [newCat, setNewCat] = useState("")
  const [newMethod, setNewMethod] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)

  async function onFile(f?: File) {
    if (!f) return
    try {
      const b = await readBackup(f)
      s.importBackup(b)
      toast.success("Backup restaurado", { description: `${b.expenses.length} lançamentos` })
    } catch (e) { toast.error((e as Error).message) }
  }
  function exportNow() {
    downloadJson(s.exportBackup(), `financas-backup-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success("Backup baixado")
  }
  const addTo = (key: "categories" | "methods", v: string, clear: () => void) => {
    const t = v.trim()
    if (!t || s.settings[key].includes(t)) return
    s.updateSettings({ [key]: [...s.settings[key], t] })
    clear()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 md:space-y-8">
      <h2 className="text-2xl font-semibold tracking-tight">Ajustes & backup</h2>


      <Card>
        <CardHeader>
          <CardTitle>Backup dos dados</CardTitle>
          <CardDescription>
            Seus dados ficam salvos apenas neste navegador/aparelho. Exporte um backup com frequência e use-o para levar os dados para outro dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={exportNow}><Download /> Exportar backup (.json)</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = "" }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><FileUp /> Restaurar backup</Button>
          {install && <Button variant="outline" onClick={install}><Smartphone /> Instalar app</Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SheetIcon className="size-4" /> Google Planilhas</CardTitle>
          <CardDescription>
            {s.settings.sheetUrl
              ? "Dados importados da sua planilha. Se você continuar editando lá, use “Atualizar” para trazer as mudanças (substitui os dados do app)."
              : "Importe todos os meses de uma planilha compartilhada por link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant={s.settings.sheetUrl ? "default" : "outline"} onClick={() => setSheetOpen(true)}>
            {s.settings.sheetUrl ? <><RefreshCw /> Atualizar da planilha</> : <><SheetIcon /> Importar planilha</>}
          </Button>
        </CardContent>
      </Card>
      <SheetImportDialog open={sheetOpen} onOpenChange={setSheetOpen} defaultUrl={s.settings.sheetUrl ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>Moeda e renda</CardTitle>
          <CardDescription>Nome, foto e conta ficam em <a href="#/conta" className="underline underline-offset-2">Minha conta</a>.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <FieldLabel required>Moeda</FieldLabel>
            <CurrencyField />

          </div>
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="st-sal" optional>Renda padrão para novos meses</FieldLabel>
            <MoneyInput id="st-sal" value={s.settings.defaultSalary} onChange={(v) => s.updateSettings({ defaultSalary: v })} />
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b border-foreground/10 py-4">
          <CardTitle>Renda por mês</CardTitle>
          <CardDescription>Clique no valor para alterar a renda de um mês específico.</CardDescription>
        </CardHeader>
        <DataTable
          id="renda-mensal"
          rows={months}
          rowId={(m) => m.id}
          label="meses"
          pageSize={10}
          search={(m) => monthLabel(m.id)}
          searchPlaceholder="Buscar mês…"
          emptyText="Nenhum mês cadastrado."
          columns={[
            { id: "month", header: "Mês", fixed: true, sortValue: (m) => m.id, filterValue: (m) => m.id.slice(0, 4),
              cell: (m) => <span className="font-medium whitespace-nowrap">{monthLabel(m.id)}</span> },
            { id: "salary", header: "Renda", fixed: true, sortValue: (m) => m.salary,
              cell: (m) => <InlineMoney value={m.salary} onSave={(v) => { s.setSalary(m.id, v); toast.success(`Renda de ${monthLabel(m.id)}: ${money(v)}`) }} /> },
          ]}
          rowActions={(m) => (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Excluir mês" />}><Trash2 /></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {monthLabel(m.id)}?</AlertDialogTitle>
                  <AlertDialogDescription>Todos os lançamentos deste mês serão removidos.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => s.deleteMonth(m.id)}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        />
      </Card>

      <div className="grid gap-4 md:gap-5 md:grid-cols-2">
        <ChipEditor title="Categorias" items={s.settings.categories} value={newCat} setValue={setNewCat}
          onAdd={() => addTo("categories", newCat, () => setNewCat(""))}
          onRemove={(c) => s.updateSettings({ categories: s.settings.categories.filter((x) => x !== c) })} />
        <ChipEditor title="Métodos de pagamento" items={s.settings.methods} value={newMethod} setValue={setNewMethod}
          onAdd={() => addTo("methods", newMethod, () => setNewMethod(""))}
          onRemove={(c) => s.updateSettings({ methods: s.settings.methods.filter((x) => x !== c) })} />
      </div>

      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle>Zona de perigo</CardTitle>
          <CardDescription>Apaga todos os dados deste aparelho. Exporte um backup antes.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}><RotateCcw /> Apagar tudo e recomeçar</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar todos os dados?</AlertDialogTitle>
                <AlertDialogDescription>Isso remove {s.expenses.length} lançamentos e {s.months.length} meses deste aparelho.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => { s.resetAll(); window.location.hash = "" }}>Apagar tudo</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

function ChipEditor({ title, items, value, setValue, onAdd, onRemove }: {
  title: string; items: string[]; value: string; setValue: (v: string) => void; onAdd: () => void; onRemove: (v: string) => void
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {items.map((c) => (
            <Badge key={c} variant="secondary" className="h-6 gap-1 pr-1">
              {c}
              <button onClick={() => onRemove(c)} aria-label={`Remover ${c}`} className="rounded-full p-0.5 hover:bg-foreground/10"><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); onAdd() }}>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Adicionar…" />
          <Button type="submit" variant="outline" size="icon" aria-label="Adicionar"><Plus /></Button>
        </form>
      </CardContent>
    </Card>
  )
}
