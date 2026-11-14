import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ArrowLeft, ArrowRight, CloudCheck, Loader2, ShieldCheck, Sparkles, UserRound, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FieldLabel } from "@/components/field-label"
import { MoneyInput } from "@/components/money-input"
import { SimpleSelect } from "@/components/simple-select"
import { AppLogo } from "@/components/app-logo"
import { AuthorCredit } from "@/components/author-credit"
import { FunSteps } from "@/components/fun-steps"
import { GoogleIcon } from "@/components/google-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { SheetImportDialog } from "@/components/sheet-import-dialog"
import { useStore } from "@/lib/store"
import { readBackup } from "@/lib/backup"
import { demoBackup } from "@/lib/demo"
import { currentMonthId } from "@/lib/format"
import { CURRENCIES } from "@/lib/currency"
import { googleEnabled } from "@/lib/config"
import { forgetLastAccount, lastAccount, signIn, useSync } from "@/lib/sync"
import { ScopeError } from "@/lib/google"
import { cn } from "@/lib/utils"

type View = "home" | "guest"

export function Onboarding() {
  const { importBackup, startEmpty } = useStore()
  const user = useSync((s) => s.user)
  const syncStatus = useSync((s) => s.status)
  const fileId = useSync((s) => s.fileId)
  const syncError = useSync((s) => s.error)
  const fileRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<View>("home")
  const [name, setName] = useState("")
  const [salary, setSalary] = useState(0)
  const [currency, setCurrency] = useState("BRL")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const [last, setLast] = useState(lastAccount)
  async function google(opts?: { hint?: string; chooseAccount?: boolean; consent?: boolean }) {
    setBusy(true)
    try { await signIn(opts) } catch (e) { if (!(e instanceof ScopeError)) toast.error((e as Error).message) } finally { setBusy(false) }
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
    if (!salary) return toast.error("Informe sua renda mensal.")
    startEmpty(salary, n, currentMonthId())
    useStore.getState().updateSettings({ currency })
  }

  // Já conectado ao Google (ex.: voltou depois): entra direto
  useEffect(() => {
    // Só entra no app quando o Google respondeu de verdade (planilha encontrada/criada)
    if (user && fileId && syncStatus !== "connecting") startEmpty(0, user.name.split(" ")[0], currentMonthId())
  }, [user, fileId, syncStatus, startEmpty])

  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  // Posição alvo (mouse) e atual (suavizada): a luz "desliza" até o cursor
  const target = useRef({ x: 0.5, y: 0.4, on: 0 })
  const current = useRef({ x: 0.5, y: 0.4, on: 0 })
  useEffect(() => {
    const el = rootRef.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const tick = () => {
      const t = target.current, c = current.current
      c.x += (t.x - c.x) * 0.08
      c.y += (t.y - c.y) * 0.08
      c.on += (t.on - c.on) * 0.06
      const r = el.getBoundingClientRect()
      el.style.setProperty("--mx", `${c.x * r.width}px`)
      el.style.setProperty("--my", `${c.y * r.height}px`)
      el.style.setProperty("--rx", `${(c.y - 0.5) * -3}deg`)
      el.style.setProperty("--ry", `${(c.x - 0.5) * 3.5}deg`)
      el.style.setProperty("--spot", c.on.toFixed(3))
      const cr = cardRef.current?.getBoundingClientRect()
      if (cr) { el.style.setProperty("--card-x", `${cr.left - r.left}px`); el.style.setProperty("--card-y", `${cr.top - r.top}px`) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  const onMove = useCallback((e: React.PointerEvent) => {
    const el = rootRef.current
    if (!el || e.pointerType === "touch") return
    const r = el.getBoundingClientRect()
    target.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, on: 1 }
  }, [])
  const onLeave = useCallback(() => { target.current = { x: 0.5, y: 0.4, on: 0 } }, [])

  return (
    <div ref={rootRef} onPointerMove={onMove} onPointerLeave={onLeave}
      style={{ "--mx": "50%", "--my": "40%", "--rx": "0deg", "--ry": "0deg", "--spot": "0" } as React.CSSProperties}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 [perspective:1200px]">
      <Backdrop />
      <div className="absolute top-3 right-3 rounded-full glass"><ThemeToggle /></div>

      <main className="relative w-full max-w-[400px]">
        <div ref={cardRef} className="relative rounded-[28px] p-7 sm:p-8">
          {/* placa de vidro inclinada (decorativa); o conteúdo fica parado para os cliques serem confiáveis */}
          <div aria-hidden className="tilt-card pointer-events-none absolute inset-0 rounded-[28px] glass"
            style={{ transform: "rotateX(var(--rx)) rotateY(var(--ry))" }}>
            <div className="absolute -inset-px rounded-[28px]" style={{
              opacity: "var(--spot)",
              padding: 1,
              background: "radial-gradient(260px circle at calc(var(--mx) - var(--card-x, 0px)) calc(var(--my) - var(--card-y, 0px)), color-mix(in srgb, #3B82F6 70%, white), transparent 70%)",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }} />
          </div>
          <div className="relative">
          <div className="flex flex-col items-center text-center">
            <AppLogo className="size-16 shadow-[0_14px_40px_-8px_rgba(59,130,246,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-500 hover:-rotate-6 hover:scale-105" />
            <h1 className="mt-5 font-brand text-[28px] leading-none font-semibold tracking-tight">finitree</h1>
            <p className="mt-1.5 text-sm text-balance text-muted-foreground">
              {view === "guest"
                  ? "Só precisamos de duas informações para começar."
                  : "Suas finanças crescendo, mês a mês. Gastos, parcelas e cartões num só lugar."}
            </p>
          </div>

          {/* Conectando ao Google */}
          {busy && syncStatus === "connecting" && (
            <div className="mt-7 rounded-2xl bg-foreground/[0.03] p-4 ring-1 ring-foreground/8 animate-in fade-in-0 zoom-in-95">
              <FunSteps
                active={user ? 2 : 0}
                steps={[
                  { label: "Conectando com o Google", hint: "Confirme sua conta na janela que abriu" },
                  { label: "Procurando sua planilha no Drive" },
                  { label: "Plantando sua árvore de finanças 🌱" },
                ]}
                quips={["Coando o café ☕", "Abrindo a porta para você…", "Ajeitando os gráficos 📊"]}
              />
            </div>
          )}

          {/* Faltou a permissão do Drive */}
          {syncStatus === "needs-scope" && !busy && (
            <div className="mt-6 space-y-3 rounded-2xl bg-warning/10 p-4 text-sm ring-1 ring-warning/30 animate-in fade-in-0">
              <p className="font-medium">Falta só uma permissão</p>
              <p className="text-xs text-muted-foreground">{syncError} Sem ela não conseguimos guardar seus dados na sua conta.</p>
              <Button className="w-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => google({ consent: true })}>
                <GoogleIcon className="size-4" /> Conceder acesso ao Google Drive
              </Button>
            </div>
          )}

          {/* Tela inicial */}
          {!user && view === "home" && !(busy && syncStatus === "connecting") && (
            <>
              <div className="mt-6 flex justify-center gap-1.5">
                <Pill icon={WifiOff}>Offline</Pill>
                <Pill icon={CloudCheck}>Salvo no Google</Pill>
                <Pill icon={ShieldCheck}>Privado</Pill>
              </div>
              <div className="mt-7 grid gap-2.5">
                {googleEnabled() && last && (
                  <div className="group/last relative">
                    <button disabled={busy} onClick={() => google({ hint: last.email })}
                      className="flex w-full items-center gap-3 rounded-2xl bg-foreground/[0.04] p-3 text-left ring-1 ring-foreground/10 transition hover:bg-brand/10 hover:ring-brand/40 active:scale-[0.98] disabled:opacity-60">
                      <span className="relative shrink-0">
                        {last.picture
                          ? <img src={last.picture} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full object-cover" />
                          : <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-chart-1 to-chart-3 text-sm font-semibold text-white">{last.name[0]}</span>}
                        <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-background ring-2 ring-background"><GoogleIcon className="size-3.5" /></span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">Continuar como {last.name.split(" ")[0]}</span>
                        <span className="block truncate text-xs text-muted-foreground">{last.email}</span>
                      </span>
                      {busy ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover/last:translate-x-0.5" />}
                    </button>
                    <button onClick={() => { forgetLastAccount(); setLast(null) }} aria-label="Esquecer esta conta" title="Esquecer esta conta"
                      className="absolute -top-2 -right-2 hidden size-6 items-center justify-center rounded-full bg-popover text-xs text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground group-hover/last:flex">×</button>
                  </div>
                )}
                {googleEnabled() && last && (
                  <button disabled={busy} onClick={() => google({ chooseAccount: true })} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                    Usar outra conta Google
                  </button>
                )}
                {googleEnabled() && !last && (
                  <Button size="lg" disabled={busy} onClick={() => google()}
                    className="h-11 gap-2.5 bg-foreground text-background hover:bg-foreground/90">
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
                <FieldLabel htmlFor="ob-name" required>Como podemos te chamar?</FieldLabel>
                <Input id="ob-name" autoFocus className="h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              </div>
              <div className="grid gap-1.5">
                <FieldLabel htmlFor="ob-sal" required>Renda mensal</FieldLabel>
                <div className="flex gap-2">
                  <SimpleSelect className="w-28 shrink-0 data-[size=default]:h-10" value={currency} onChange={setCurrency}
                    options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.flag} ${c.code}` }))} />
                  <MoneyInput id="ob-sal" className="h-10" hideFlag currency={currency} value={salary} onChange={setSalary} />
                </div>
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

/** Fundo: brilhos em Blue Period que flutuam, luz difusa que segue o mouse e grade fina que acende perto dele */
function Backdrop({ className }: { className?: string }) {
  const grid = (alpha: number, size = 22) => ({
    backgroundImage: `linear-gradient(to right, color-mix(in srgb, var(--foreground) ${alpha}%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) ${alpha}%, transparent) 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
  })
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="animate-drift-a absolute -top-40 left-1/2 size-[680px] rounded-full bg-brand/22 blur-[130px] dark:bg-brand/18" />
      <div className="animate-drift-b absolute -bottom-48 -left-24 size-[440px] rounded-full bg-[#6D28D9]/14 blur-[120px]" />
      <div className="animate-drift-c absolute -right-24 bottom-10 size-[380px] rounded-full bg-[#7DD3FC]/14 blur-[120px]" />
      {/* grade de base, bem discreta */}
      <div className="absolute inset-0 opacity-50 dark:opacity-40" style={{
        ...grid(4),
        maskImage: "radial-gradient(ellipse 55% 50% at 50% 45%, black 10%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse 55% 50% at 50% 45%, black 10%, transparent 75%)",
      }} />
      {/* luz difusa que segue o cursor */}
      <div className="absolute inset-0" style={{
        opacity: "var(--spot)",
        background: "radial-gradient(700px circle at var(--mx) var(--my), color-mix(in srgb, #3B82F6 13%, transparent), color-mix(in srgb, #3B82F6 4%, transparent) 40%, transparent 70%)",
      }} />
      {/* grade que acende suavemente perto do cursor */}
      <div className="absolute inset-0" style={{
        opacity: "calc(var(--spot) * 0.9)",
        ...grid(10),
        maskImage: "radial-gradient(240px circle at var(--mx) var(--my), rgba(0,0,0,0.9), rgba(0,0,0,0.35) 40%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(240px circle at var(--mx) var(--my), rgba(0,0,0,0.9), rgba(0,0,0,0.35) 40%, transparent 75%)",
      }} />
    </div>
  )
}
