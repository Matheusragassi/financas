import { LayoutDashboard, ListChecks, CreditCard, BarChart3, Settings, WifiOff, UserRound } from "lucide-react"
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
  { route: "parcelas", label: "Parcelas", icon: CreditCard },
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
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#/dashboard" />}>
              <AppLogo className="size-8" />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Finanças</span>
                <span className="truncate text-xs text-muted-foreground">{name ? `de ${name}` : "Controle pessoal"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          {online ? <span className="size-2 rounded-full bg-success" /> : <WifiOff className="size-3.5" />}
          {!online ? "Offline · tudo continua funcionando" : googleUser ? "Online · salvo na sua conta Google" : "Online · dados salvos neste aparelho"}
        </div>
        <NavUser />
        <AuthorCredit className="px-2 pb-1 group-data-[collapsible=icon]:hidden" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
