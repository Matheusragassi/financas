import { useStore } from "@/lib/store"
import { useSync } from "@/lib/sync"
import { cn } from "@/lib/utils"

/** Foto do perfil: escolhida pelo usuário > foto do Google > iniciais */
export function useProfile() {
  const settings = useStore((s) => s.settings)
  const isDemo = useStore((s) => s.isDemo)
  const user = useSync((s) => s.user)
  const first = settings.ownerName || user?.name.split(" ")[0] || ""
  const last = settings.lastName ?? (user?.name.split(" ").slice(1).join(" ") || "")
  return {
    first,
    last,
    fullName: [first, last].filter(Boolean).join(" ") || "Visitante",
    email: user?.email || settings.email || "",
    photo: settings.photo || user?.picture || "",
    googlePhoto: user?.picture || "",
    google: !!user,
    isDemo,
  }
}

export function UserAvatar({ className }: { className?: string }) {
  const { photo, fullName } = useProfile()
  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?"
  return photo
    ? <img src={photo} alt="" referrerPolicy="no-referrer" className={cn("size-8 shrink-0 rounded-full object-cover", className)} />
    : (
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-chart-1 to-chart-7 text-xs font-semibold text-white", className)}>
        {initials}
      </span>
    )
}
