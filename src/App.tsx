import { ChevronLeft, ChevronRight, Plus, Sparkles, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { setCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MonthPicker } from "@/components/month-picker"
import { ThemeToggle } from "@/components/theme-toggle"
import { SyncIndicator } from "@/components/sync-indicator"
import { ExpenseForm } from "@/components/expense-form"
import { useStore } from "@/lib/store"
import { navigate, useRoute, type Route } from "@/lib/use-route"
import { useSelectedMonth } from "@/lib/use-month"
import { Onboarding } from "@/pages/onboarding"
import { Dashboard } from "@/pages/dashboard"
import { Expenses } from "@/pages/expenses"
import { Installments } from "@/pages/installments"
import { Reports } from "@/pages/reports"
import { SettingsPage } from "@/pages/settings"
import { AccountPage } from "@/pages/account"
import { CardsPage } from "@/pages/cards"

const TITLES = {
  dashboard: "Visão geral",
  lancamentos: "Lançamentos",
  parcelas: "Parcelas",
  relatorios: "Relatórios",
  ajustes: "Ajustes & backup",
  conta: "Minha conta",
  cartoes: "Cartões",
} as const

/** Hierarquia para o breadcrumb */
const PARENT: Partial<Record<Route, Route>> = {}

export default function App() {
  const initialized = useStore((s) => s.initialized)
  const isDemo = useStore((s) => s.isDemo)
  const resetAll = useStore((s) => s.resetAll)
  const route = useRoute()
  const month = useSelectedMonth()
  const [adding, setAdding] = useState(false)
  const currency = useStore((s) => s.settings.currency ?? "BRL")
  setCurrency(currency)
  useEffect(() => setCurrency(currency), [currency])

  if (!initialized) return <Onboarding />

  return (
    <SidebarProvider>
      <AppBackdrop />
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-foreground/6 px-4 glass-subtle md:rounded-t-2xl md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 hidden h-4! self-center sm:block" />
          <nav aria-label="Você está em" className="flex min-w-0 items-center gap-1.5 text-sm">
            {route !== "dashboard" && (
              <button onClick={() => history.length > 1 ? history.back() : navigate("dashboard")} aria-label="Voltar"
                className="mr-0.5 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground active:scale-95">
                <ChevronLeft className="size-4" />
              </button>
            )}
            <a href="#/dashboard" className="hidden font-brand font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground sm:inline">finitree</a>
            <ChevronRight className="hidden size-3.5 text-muted-foreground/60 sm:block" />
            {PARENT[route] && (
              <>
                <a href={`#/${PARENT[route]}`} className="hidden text-muted-foreground transition-colors hover:text-foreground md:inline">{TITLES[PARENT[route]!]}</a>
                <ChevronRight className="hidden size-3.5 text-muted-foreground/60 md:block" />
              </>
            )}
            <h1 className="truncate font-medium">{TITLES[route]}</h1>
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {!["ajustes", "relatorios", "conta"].includes(route) && <MonthPicker />}
            <ThemeToggle />
            <SyncIndicator />
            <Button size="sm" onClick={() => setAdding(true)} className="hidden bg-brand text-brand-foreground hover:bg-brand/90 sm:inline-flex">
              <Plus /> Novo gasto
            </Button>
          </div>
        </header>
        {isDemo && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-brand/10 px-3 py-2 text-sm md:px-4">
            <Sparkles className="size-4 text-brand" />
            <span>Você está vendo uma <b>demonstração</b> com dados fictícios.</span>
            <Button size="sm" className="ml-auto" onClick={() => { resetAll(); window.location.hash = ""; window.scrollTo(0, 0) }}>
              <LogOut /> Sair da demo e usar meus dados
            </Button>
          </div>
        )}
        <main key={currency} className="relative mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">
          {route === "dashboard" && <Dashboard onAdd={() => setAdding(true)} />}
          {route === "lancamentos" && <Expenses />}
          {route === "parcelas" && <Installments />}
          {route === "relatorios" && <Reports />}
          {route === "ajustes" && <SettingsPage />}
          {route === "conta" && <AccountPage />}
          {route === "cartoes" && <CardsPage />}
        </main>
        <Button
          size="icon-lg"
          className="fixed right-4 bottom-4 z-30 size-14 rounded-full bg-brand text-brand-foreground shadow-[0_10px_30px_-6px_rgba(59,130,246,0.6)] hover:bg-brand/90 sm:hidden"
          onClick={() => setAdding(true)}
          aria-label="Novo gasto"
        >
          <Plus className="size-6" />
        </Button>
      </SidebarInset>
      <ExpenseForm open={adding} onOpenChange={setAdding} month={month} />
    </SidebarProvider>
  )
}

/** Brilhos suaves fixos atrás do conteúdo: dão profundidade e fazem o vidro aparecer */
function AppBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute -top-56 left-[20%] size-[640px] rounded-full bg-brand/28 blur-[130px] dark:bg-brand/20" />
      <div className="absolute top-[28%] -right-40 size-[540px] rounded-full bg-[#A78BFA]/26 blur-[130px] dark:bg-[#A78BFA]/14" />
      <div className="absolute -bottom-56 left-[35%] size-[580px] rounded-full bg-[#7DD3FC]/30 blur-[140px] dark:bg-[#7DD3FC]/12" />
      <div className="absolute top-[55%] left-[8%] size-[380px] rounded-full bg-brand/18 blur-[120px] dark:bg-brand/12" />
    </div>
  )
}
