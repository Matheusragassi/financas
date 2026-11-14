import { cn } from "@/lib/utils"

/*
 * Folia — "folha" em festa. Logotipo em pixel no grid de 13 px da MAVI:
 * o O é uma folha (e o pingo do I também). A folha-O sozinha é o símbolo da marca.
 */
const F = ["XXX", "XX.", "X.."]
const O_LEAF = ["gg.", "g.g", ".gg"]
const L = ["X..", "X..", "XXX"]
const I = ["g", "X", "X"]
const A = ["XXX", "XXX", "X.X"]

const B = 13
interface Px { x: number; y: number; leaf: boolean }
const WORD_BLOCKS: Px[] = []
let ox = 0
for (const g of [F, O_LEAF, L, I, A]) {
  g.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") WORD_BLOCKS.push({ x: x + ox, y, leaf: c === "g" }) }))
  ox += g[0].length + 1
}
const WORD_W = (ox - 1) * B // 17 blocos
const LEAF_BLOCKS: Px[] = []
O_LEAF.forEach((row, y) => [...row].forEach((c, x) => { if (c !== ".") LEAF_BLOCKS.push({ x, y, leaf: true }) }))

const rects = (blocks: Px[], leaf: string) =>
  [...blocks].sort((a, b) => Number(a.leaf) - Number(b.leaf)).map((p, i) => (
    <rect key={i} x={p.x * B} y={p.y * B} width={B + 0.2} height={B + 0.2} fill={p.leaf ? leaf : undefined} />
  ))

/** Logotipo "FOLIA" (traço herda a cor do texto; folhas na cor da marca) */
export function FoliaWordmark({ className, leaf = "var(--logo-leaf, #9BE858)" }: { className?: string; leaf?: string }) {
  return (
    <svg viewBox={`0 0 ${WORD_W} ${3 * B}`} className={className} fill="currentColor" shapeRendering="crispEdges" role="img" aria-label="Folia">
      {rects(WORD_BLOCKS, leaf)}
    </svg>
  )
}

/** Símbolo da marca: a folha-O do logotipo */
export function FoliaMark({ className, leaf = "currentColor" }: { className?: string; leaf?: string }) {
  return (
    <svg viewBox={`0 0 ${3 * B} ${3 * B}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
      {rects(LEAF_BLOCKS, leaf)}
    </svg>
  )
}

/** Ícone do app: folha branca sobre o verde da Folia */
export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[28%] bg-[linear-gradient(145deg,#5EE3B0,#34D399_55%,#0b9e6f)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]", className)}>
      <FoliaMark className="h-[54%] w-auto" leaf="#ffffff" />
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
