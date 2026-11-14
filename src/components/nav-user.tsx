import { useState } from "react"
import { ChevronsUpDown, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { UserAvatar, useProfile } from "@/components/user-avatar"
import { SignOutDialog } from "@/components/sign-out-dialog"
import { navigate } from "@/lib/use-route"

export function NavUser() {
  const p = useProfile()
  const { isMobile, setOpenMobile } = useSidebar()
  const [leaving, setLeaving] = useState(false)
  const go = (r: Parameters<typeof navigate>[0]) => { navigate(r); setOpenMobile(false) }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0!" />}>
            <span className="relative">
              <UserAvatar className="size-8" />
            </span>
            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-medium">{p.isDemo ? "Demonstração" : p.fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{p.isDemo ? "dados fictícios" : p.email || "Sem conta conectada"}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side={isMobile ? "top" : "right"} align="end" sideOffset={6} className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2 py-1.5 text-foreground">
                <UserAvatar className="size-8" />
                <div className="grid leading-tight">
                  <span className="truncate text-sm font-medium">{p.isDemo ? "Demonstração" : p.fullName}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{p.email || "Sem conta conectada"}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {!p.isDemo && <DropdownMenuItem onClick={() => go("conta")}><UserRound /> Minha conta</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => go("ajustes")}><Settings /> Ajustes & backup</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open("./privacidade.html", "_blank")}><ShieldCheck /> Privacidade</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setLeaving(true)}><LogOut /> {p.isDemo ? "Sair da demonstração" : "Sair"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SignOutDialog open={leaving} onOpenChange={setLeaving} />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
