import { cn } from "@/lib/utils"

const LOGO_PATH = "M13 4 L13 3 L10 3 L10 0 L18 0 L18 4 L20 4 L20 0 L21 0 L21 5 L17 5 L17 1 L16 1 L16 5 L15 5 L15 1 L11 1 L11 2 L14 2 L14 5 L8 5 L8 4 L6 4 L6 5 L5 5 L5 4 L4 4 L4 5 L0 5 L0 0 L4 0 L4 1 L1 1 L1 4 L3 4 L3 3 L5 3 L5 0 L9 0 L9 4ZM6 1 L6 3 L8 3 L8 1Z"
const SYMBOL_PATH = "M1 1 L1 4 L3 4 L3 3 L5 3 L5 4 L4 4 L4 5 L0 5 L0 0 L4 0 L4 1Z"

export function GastuLogo({ className, fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 21 5" className={className} shapeRendering="crispEdges" role="img" aria-label="Gastu">
      <path d={LOGO_PATH} fill={fill} />
    </svg>
  )
}

export function GastuSymbol({ className, fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 5 5" className={className} shapeRendering="crispEdges" role="img" aria-label="Gastu">
      <path d={SYMBOL_PATH} fill={fill} />
    </svg>
  )
}

export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[28%] bg-[#1A3FEB] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]", className)}>
      <svg viewBox="0 0 9 9" className="h-full w-full" shapeRendering="crispEdges" role="img" aria-label="Gastu">
        <rect width="9" height="9" fill="#1A3FEB" />
        <path transform="translate(2 2)" d={SYMBOL_PATH} fill="#fff" />
        <rect x="7" y="5" width="2" height="1" fill="#fff" />
      </svg>
    </span>
  )
}

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
