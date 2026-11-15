import { CalendarClock, LayoutDashboard, ListChecks, CreditCard, BarChart3, Settings, UserRound } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar"
import { useRoute, type Route } from "@/lib/use-route"
import { useStore } from "@/lib/store"
import { useOnline } from "@/lib/use-online"
import { AuthorCredit } from "@/components/author-credit"
import { NavUser } from "@/components/nav-user"
import { AppLogo } from "@/components/app-logo"
import { useSync } from "@/lib/sync"

const NAV: { route: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { route: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { route: "lancamentos", label: "Lançamentos", icon: ListChecks },
  { route: "parcelas", label: "Parcelas", icon: CalendarClock },
  { route: "cartoes", label: "Cartões", icon: CreditCard },
  { route: "relatorios", label: "Relatórios", icon: BarChart3 },
  { route: "ajustes", label: "Ajustes & backup", icon: Settings },
  { route: "conta", label: "Minha conta", icon: UserRound },
]

export function AppSidebar() {
  const route = useRoute()
  const name = useStore((s) => s.settings.ownerName)
  const online = useOnline()
  const googleUser = useSync((s) => s.user)
  const { setOpenMobile } = useSidebar()
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="px-3 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!" render={<a href="#/dashboard" />}>
              <AppLogo className="size-8 shrink-0 transition-transform group-hover/menu-button:scale-105" />
              <div className="flex flex-1 flex-col overflow-hidden text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-[15px] leading-none font-semibold tracking-tight">Gastu</span>
                <span className="truncate text-[11px] text-muted-foreground">{name ? `de ${name}` : "finanças pessoais"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-2.5 text-[11px] tracking-wider uppercase">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((n) => (
                <SidebarMenuItem key={n.route}>
                  <SidebarMenuButton
                    isActive={route === n.route}
                    tooltip={n.label}
                    className="data-active:bg-brand/12 data-active:text-foreground data-active:[&>svg]:text-brand"
                    render={<a href={`#/${n.route}`} onClick={() => setOpenMobile(false)} />}
                  >
                    <n.icon />
                    <span>{n.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="gap-3 px-3 pb-3 group-data-[collapsible=icon]:px-0">
        <ConnectionPill online={online} google={!!googleUser} />
        <NavUser />
        <AuthorCredit className="px-2.5 group-data-[collapsible=icon]:hidden" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function ConnectionPill({ online, google }: { online: boolean; google: boolean }) {
  return (
    <div
      title={!online ? "Sem internet: tudo continua funcionando e é salvo quando a conexão voltar" : google ? "Seus dados são salvos automaticamente na sua conta Google" : "Seus dados ficam salvos só neste aparelho"}
      className="flex items-center gap-2 rounded-xl bg-foreground/[0.035] px-2.5 py-2 text-xs ring-1 ring-foreground/6 group-data-[collapsible=icon]:hidden"
    >
      <span className="relative flex size-2">
        {online && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 [animation-duration:2s]" />}
        <span className={online ? "relative inline-flex size-2 rounded-full bg-success" : "relative inline-flex size-2 rounded-full bg-warning"} />
      </span>
      <span className="font-medium">{online ? "Online" : "Offline"}</span>
      <span className="ml-auto truncate text-muted-foreground">{google ? "Salvo no Google" : "Neste aparelho"}</span>
    </div>
  )
}
