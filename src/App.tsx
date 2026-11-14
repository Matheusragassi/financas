import { Plus, Sparkles, LogOut } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MonthPicker } from "@/components/month-picker"
import { ThemeToggle } from "@/components/theme-toggle"
import { SyncIndicator } from "@/components/sync-indicator"
import { ExpenseForm } from "@/components/expense-form"
import { useStore } from "@/lib/store"
import { useRoute } from "@/lib/use-route"
import { useSelectedMonth } from "@/lib/use-month"
import { Onboarding } from "@/pages/onboarding"
import { Dashboard } from "@/pages/dashboard"
import { Expenses } from "@/pages/expenses"
import { Installments } from "@/pages/installments"
import { Reports } from "@/pages/reports"
import { SettingsPage } from "@/pages/settings"
import { AccountPage } from "@/pages/account"

const TITLES = {
  dashboard: "Visão geral",
  lancamentos: "Lançamentos",
  parcelas: "Parcelas",
  relatorios: "Relatórios",
  ajustes: "Ajustes & backup",
  conta: "Minha conta",
} as const

export default function App() {
  const initialized = useStore((s) => s.initialized)
  const isDemo = useStore((s) => s.isDemo)
  const resetAll = useStore((s) => s.resetAll)
  const route = useRoute()
  const month = useSelectedMonth()
  const [adding, setAdding] = useState(false)

  if (!initialized) return <Onboarding />

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur md:rounded-t-xl md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 hidden h-4! self-center sm:block" />
          <h1 className="hidden text-sm font-medium sm:block">{TITLES[route]}</h1>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {!["ajustes", "relatorios", "conta"].includes(route) && <MonthPicker />}
            <ThemeToggle />
            <SyncIndicator />
            <Button size="sm" onClick={() => setAdding(true)} className="hidden sm:inline-flex">
              <Plus /> Novo gasto
            </Button>
          </div>
        </header>
        {isDemo && (
          <div className="flex flex-wrap items-center gap-2 border-b bg-chart-1/10 px-3 py-2 text-sm md:px-4">
            <Sparkles className="size-4 text-chart-1" />
            <span>Você está vendo uma <b>demonstração</b> com dados fictícios.</span>
            <Button size="sm" className="ml-auto" onClick={() => { resetAll(); window.location.hash = ""; window.scrollTo(0, 0) }}>
              <LogOut /> Sair da demo e usar meus dados
            </Button>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 p-3 pb-24 md:p-6">
          {route === "dashboard" && <Dashboard onAdd={() => setAdding(true)} />}
          {route === "lancamentos" && <Expenses />}
          {route === "parcelas" && <Installments />}
          {route === "relatorios" && <Reports />}
          {route === "ajustes" && <SettingsPage />}
          {route === "conta" && <AccountPage />}
        </main>
        <Button
          size="icon-lg"
          className="fixed right-4 bottom-4 z-30 size-14 rounded-full shadow-lg sm:hidden"
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
