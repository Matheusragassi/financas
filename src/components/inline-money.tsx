import { useEffect, useRef, useState } from "react"
import { money, parseMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Valor clicável que vira campo de edição (atualização rápida de preço) */
export function InlineMoney({ value, onSave, className }: { value: number; onSave: (v: number) => void; className?: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (editing) ref.current?.select() }, [editing])
  if (!editing)
    return (
      <button
        type="button"
        title="Clique para alterar o valor"
        onClick={() => { setText(value.toFixed(2).replace(".", ",")); setEditing(true) }}
        className={cn("num rounded-md px-1.5 py-0.5 font-medium hover:bg-muted hover:ring-1 hover:ring-border", className)}
      >
        {money(value)}
      </button>
    )
  const commit = () => {
    const v = parseMoney(text)
    if (v > 0 && v !== value) onSave(v)
    setEditing(false)
  }
  return (
    <input
      ref={ref}
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
      className="num h-7 w-28 rounded-md border bg-background px-2 text-right text-sm outline-none focus:ring-2 focus:ring-ring/50"
    />
  )
}
