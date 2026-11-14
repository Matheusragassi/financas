import { cn } from "@/lib/utils"

/*
 * Quest — finanças como missões. Símbolo em pixel (grid de 13px, sistema MAVI):
 * um balão de diálogo (a quest que se resolve conversando) com a perna do "Q".
 * O ponto central é o ponto de interação (azul da marca).
 */
const B = 13
// X = traço; o = ponto de interação
const GRID = ["XXXXX", "X...X", "X.o.X", "X...X", "XX.XX", ".X..."]
interface Px { x: number; y: number; dot: boolean }
const BLOCKS: Px[] = []
GRID.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") BLOCKS.push({ x, y, dot: c === "o" }) }))
const W = GRID[0].length * B
const H = GRID.length * B

/** Símbolo da marca (traço herda a cor do texto; ponto na cor da marca) */
export function QuestMark({ className, stroke = "currentColor", dot = "#3B82F6" }: { className?: string; stroke?: string; dot?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} shapeRendering="crispEdges" role="img" aria-label="Quest">
      {[...BLOCKS].sort((a, b) => Number(a.dot) - Number(b.dot)).map((p, i) => (
        <rect key={i} x={p.x * B} y={p.y * B} width={B + 0.3} height={B + 0.3} fill={p.dot ? dot : stroke} />
      ))}
    </svg>
  )
}

/** Ícone do app: símbolo branco sobre o azul da marca, ponto azul vivo */
export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[28%] bg-[linear-gradient(145deg,#5B9BFF,#3B82F6_55%,#2557C7)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]", className)}>
      <QuestMark className="h-[56%] w-auto" stroke="#ffffff" dot="#1E40AF" />
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
