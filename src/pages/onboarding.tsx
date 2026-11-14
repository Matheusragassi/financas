import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, CloudCheck, Loader2, ShieldCheck, Sparkles, UserRound, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLogo } from "@/components/app-logo"
import { AuthorCredit } from "@/components/author-credit"
import { GoogleIcon } from "@/components/google-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { SheetImportDialog } from "@/components/sheet-import-dialog"
import { useStore } from "@/lib/store"
import { readBackup } from "@/lib/backup"
import { demoBackup } from "@/lib/demo"
import { currentMonthId, parseMoney } from "@/lib/format"
import { googleEnabled } from "@/lib/config"
import { signIn, useSync } from "@/lib/sync"
import { cn } from "@/lib/utils"

type View = "home" | "guest"

export function Onboarding() {
  const { importBackup, startEmpty } = useStore()
  const user = useSync((s) => s.user)
  const syncStatus = useSync((s) => s.status)
  const fileRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<View>("home")
  const [name, setName] = useState("")
  const [salary, setSalary] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function google() {
    setBusy(true)
    try { await signIn() } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  async function onFile(f?: File) {
    if (!f) return
    try {
      const b = await readBackup(f)
      importBackup(b)
      toast.success("Backup restaurado", { description: `${b.expenses.length} lançamentos` })
    } catch (e) { toast.error((e as Error).message) }
  }
  function start(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return toast.error("Como podemos te chamar?")
    startEmpty(parseMoney(salary), n, currentMonthId())
  }

  // Já conectado ao Google (ex.: voltou depois): entra direto
  useEffect(() => {
    if (user && syncStatus !== "connecting") startEmpty(0, user.name.split(" ")[0], currentMonthId())
  }, [user, syncStatus, startEmpty])

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10">
      <Backdrop />
      <div className="absolute top-3 right-3 rounded-full glass"><ThemeToggle /></div>

      <main className="relative w-full max-w-[400px]">
        <div className="rounded-[28px] p-7 glass sm:p-8">
          <div className="flex flex-col items-center text-center">
            <AppLogo className="size-16 drop-shadow-[0_10px_30px_rgba(59,130,246,0.45)]" />
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              Finanças
            </h1>
            <p className="mt-1.5 text-sm text-balance text-muted-foreground">
              {view === "guest"
                  ? "Só precisamos de duas informações para começar."
                  : "Seus gastos, parcelas e saldo do mês num só lugar. Simples, bonito e sempre com você."}
            </p>
          </div>

          {/* Tela inicial */}
          {!user && view === "home" && (
            <>
              <div className="mt-6 flex justify-center gap-1.5">
                <Pill icon={WifiOff}>Offline</Pill>
                <Pill icon={CloudCheck}>Salvo no Google</Pill>
                <Pill icon={ShieldCheck}>Privado</Pill>
              </div>
              <div className="mt-7 grid gap-2.5">
                {googleEnabled() && (
                  <Button size="lg" disabled={busy} onClick={google}
                    className="h-11 gap-2.5 bg-foreground text-background shadow-[0_8px_24px_-8px_rgba(59,130,246,0.6)] hover:bg-foreground/90">
                    {busy ? <Loader2 className="animate-spin" /> : <GoogleIcon className="size-[18px]" />}
                    Continuar com Google
                  </Button>
                )}
                <Button size="lg" variant="outline" className="h-11 gap-2 glass-subtle" onClick={() => importBackup(demoBackup(), { demo: true })}>
                  <Sparkles className="text-brand" /> Ver demonstração
                </Button>
              </div>
              <div className="my-5 flex items-center gap-3 text-[11px] tracking-wide text-muted-foreground uppercase">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <button onClick={() => setView("guest")}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/5">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand/12 text-brand"><UserRound className="size-4" /></span>
                <span className="flex-1">
                  <span className="block font-medium">Entrar como convidado</span>
                  <span className="block text-xs text-muted-foreground">Dados salvos só neste aparelho</span>
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            </>
          )}

          {/* Convidado / começar do zero */}
          {view === "guest" && (
            <form onSubmit={start} className="mt-6 grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="ob-name">Como podemos te chamar?</Label>
                <Input id="ob-name" autoFocus className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ob-sal">Renda mensal</Label>
                <Input id="ob-sal" className="num h-10" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="R$ 0,00" />
                <p className="text-xs text-muted-foreground">Usada para calcular saldo e comprometimento. Dá para mudar depois.</p>
              </div>
              <Button type="submit" size="lg" className="h-11 bg-brand text-brand-foreground hover:bg-brand/90">
                Começar <ArrowRight />
              </Button>
              <button type="button" onClick={() => setView("home")} className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="size-3.5" /> Voltar
              </button>
            </form>
          )}
        </div>

        {!user && view === "home" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Já tem seus dados?{" "}
            <button className="font-medium text-foreground/80 underline-offset-2 hover:text-brand hover:underline" onClick={() => setSheetOpen(true)}>Importar planilha</button>
            {" "}ou{" "}
            <button className="font-medium text-foreground/80 underline-offset-2 hover:text-brand hover:underline" onClick={() => fileRef.current?.click()}>restaurar backup</button>
          </p>
        )}
      </main>

      <footer className="relative mt-10 flex flex-col items-center gap-2 text-[11px] text-muted-foreground">
        <AuthorCredit />
        <a href="./privacidade.html" className="hover:text-foreground">Política de privacidade</a>
      </footer>

      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = "" }} />
      <SheetImportDialog open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

function Pill({ icon: Icon, children }: { icon: typeof WifiOff; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-foreground/8 bg-foreground/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground">
      <Icon className="size-3" /> {children}
    </span>
  )
}

/** Fundo: brilhos em Blue Period + grade de pixels sutil */
function Backdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px] dark:bg-brand/20" />
      <div className="absolute -bottom-48 -left-24 size-[420px] rounded-full bg-[#6D28D9]/15 blur-[110px]" />
      <div className="absolute -right-24 bottom-10 size-[360px] rounded-full bg-[#7DD3FC]/15 blur-[110px]" />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.22]"
        style={{
          backgroundImage: "linear-gradient(to right, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 7%, transparent) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black 20%, transparent 75%)",
        }}
      />
    </div>
  )
}
