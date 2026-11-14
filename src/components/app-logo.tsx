import { cn } from "@/lib/utils"

/*
 * Finitree — árvore de finanças em pixel art (grid de 13 px, como a MAVI).
 * Um cifrão em pixels cuja haste brota no topo em duas folhas:
 * o dinheiro germinando como uma árvore. A folha verde é o "fruto".
 */
export const TREE_PATH = "M0 0h13v13H0zM13 13h13v13H13zM0 26h39v13H0zM0 39h13v13H0zM0 52h39v13H0zM26 65h13v13H26zM0 78h39v13H0zM13 91h13v13H13z"
export const FRUIT = { x: 26, y: 0, s: 13 }

/** Símbolo puro (herda a cor do texto; fruto em destaque opcional) */
export function FinitreeMark({ className, fruit = "currentColor" }: { className?: string; fruit?: string }) {
  return (
    <svg viewBox="0 0 39 104" className={className} fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      <path d={TREE_PATH} />
      <rect x={FRUIT.x} y={FRUIT.y} width={FRUIT.s} height={FRUIT.s} fill={fruit} />
    </svg>
  )
}

/** Ícone do app: símbolo branco sobre Blue Period */
export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[28%] bg-[linear-gradient(145deg,#5B9BFF,#3B82F6_55%,#2557C7)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]", className)}>
      <FinitreeMark className="h-[62%] w-auto text-white" fruit="#9BE858" />
    </span>
  )
}

/** Logotipo: símbolo + nome */
export function FinitreeWordmark({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AppLogo className={iconClassName} />
      <span className="font-brand text-lg leading-none font-semibold tracking-tight">finitree</span>
    </span>
  )
}

/** Assinatura MAVI (pixel grid 13×13), herda a cor do texto */
export function MaviLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 169 39" className={className} fill="currentColor" aria-label="MAVI" role="img">
      <path d="M39 39H26V26H13V39H0V13H13V0H26V13H39V39Z" />
      <path d="M65 39H52V13H65V39ZM91 39H78V13H91V39ZM78 13H65V0H78V13Z" />
      <path d="M130 39H117V26H130V39ZM117 26H104V0H117V26ZM143 26H130V0H143V26Z" />
      <path d="M169 39H156V26H169V39ZM169 13H156V0H169V13Z" />
    </svg>
  )
}
