import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Sheet as SheetIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/field-label"
import { Progress } from "@/components/ui/progress"
import { FunSteps } from "@/components/fun-steps"
import { useStore } from "@/lib/store"
import { importFromGoogleSheet, type ImportProgress } from "@/lib/sheets-import"
import { money, monthLabel } from "@/lib/format"
import type { Backup } from "@/lib/types"

export function SheetImportDialog({ open, onOpenChange, defaultUrl = "" }: { open: boolean; onOpenChange: (o: boolean) => void; defaultUrl?: string }) {
  const { importBackup, initialized, isDemo, expenses } = useStore()
  const [url, setUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [result, setResult] = useState<Backup | null>(null)
  const [error, setError] = useState("")

  const reset = () => { setLoading(false); setProgress(null); setResult(null); setError("") }

  async function read() {
    reset()
    setLoading(true)
    try {
      setResult(await importFromGoogleSheet(url, setProgress))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function confirm() {
    if (!result) return
    importBackup(result)
    toast.success("Planilha importada", { description: `${result.expenses.length} lançamentos em ${result.months.length} meses` })
    onOpenChange(false)
    reset()
  }

  const last = result?.months.at(-1)
  const lastTotal = last ? result!.expenses.filter((e) => e.month === last.id && e.status !== "cancelled").reduce((a, e) => a + e.amount, 0) : 0

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><SheetIcon className="size-4" /> Importar do Google Planilhas</DialogTitle>
          <DialogDescription>
            Cole o link da sua planilha. Ela precisa estar compartilhada como <b>“Qualquer pessoa com o link pode ver”</b>.
            Cada aba de mês (ex.: “Janeiro - 2025”) vira um mês no app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="sheet-url" required>Link da planilha</FieldLabel>
          <Input id="sheet-url" value={url} onChange={(e) => { setUrl(e.target.value); setResult(null) }} placeholder="https://docs.google.com/spreadsheets/d/…" />
        </div>
        {(loading || result) && (
          <div className="space-y-3 rounded-2xl bg-foreground/[0.03] p-4 ring-1 ring-foreground/8">
            {loading && <Progress value={progress ? (progress.done / progress.total) * 100 : 6} />}
            <FunSteps
              done={!!result}
              active={!progress ? 0 : progress.done < progress.total ? 1 : 2}
              steps={[
                { label: "Abrindo sua planilha", hint: "Pedindo licença ao Google com educação…" },
                { label: progress ? `Lendo os meses (${progress.done}/${progress.total})` : "Lendo os meses", hint: progress?.tab ? `Agora em: ${progress.tab}` : undefined },
                { label: "Conferindo cores, parcelas e cancelados", hint: "Laranja é cancelado, verde é última parcela 🎨" },
                { label: result ? "Opa, chegamos no final! Encontramos seus dados 🎉" : "Organizando tudo para você" },
              ]}
              quips={["Coando um café enquanto lemos ☕", "Somando parcelas sem calculadora 🧮", "Separando o fixo do variável…", "Regando sua árvore de finanças 🌱", "Quase lá, prometo!"]}
            />
          </div>
        )}
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {result && (
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/60 p-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Meses</div><div className="num font-semibold">{result.months.length}</div></div>
            <div><div className="text-xs text-muted-foreground">Lançamentos</div><div className="num font-semibold">{result.expenses.length}</div></div>
            <div><div className="text-xs text-muted-foreground">{last ? monthLabel(last.id) : ""}</div><div className="num font-semibold">{money(lastTotal)}</div></div>
            {initialized && expenses.length > 0 && !isDemo && (
              <p className="col-span-3 text-xs text-warning">Isso substitui os {expenses.length} lançamentos atuais deste aparelho. Exporte um backup antes se quiser guardá-los.</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {result
            ? <Button onClick={confirm}>Importar {result.expenses.length} lançamentos</Button>
            : <Button onClick={read} disabled={loading || !url.trim()}>{loading && <Loader2 className="animate-spin" />} Ler planilha</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
