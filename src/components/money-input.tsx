import { forwardRef } from "react"
import { activeCurrency, moneyDigits } from "@/lib/format"
import { currencyOf } from "@/lib/currency"
import { cn } from "@/lib/utils"

/**
 * Campo de valor: aceita só dígitos e preenche da direita para a esquerda (centavos),
 * mostrando bandeira e símbolo da moeda. Valor sempre como número.
 */
export const MoneyInput = forwardRef<HTMLInputElement, {
  value: number
  onChange: (v: number) => void
  id?: string
  className?: string
  placeholder?: string
  autoFocus?: boolean
  currency?: string
  required?: boolean
  "aria-invalid"?: boolean
}>(function MoneyInput({ value, onChange, id, className, autoFocus, currency, required, ...rest }, ref) {
  const c = currency ? currencyOf(currency) : activeCurrency()
  const factor = 10 ** c.decimals
  const text = value ? moneyDigitsFor(value, c.code) : ""
  return (
    <div className={cn(
      "group/money flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 transition-[color,box-shadow,border-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
      className,
    )}>
      <span className="flex shrink-0 items-center gap-1.5 border-r border-border pr-2 text-xs text-muted-foreground select-none">
        <span className="text-sm leading-none">{c.flag}</span>
        <span className="font-medium">{c.symbol}</span>
      </span>
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        required={required}
        aria-invalid={rest["aria-invalid"]}
        placeholder={moneyDigitsFor(0, c.code)}
        value={text}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 13)
          onChange(digits ? Number(digits) / factor : 0)
        }}
        onFocus={(e) => requestAnimationFrame(() => e.target.setSelectionRange(e.target.value.length, e.target.value.length))}
        className="num h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  )
})

function moneyDigitsFor(v: number, code: string) {
  if (code === activeCurrency().code) return moneyDigits(v)
  const c = currencyOf(code)
  return new Intl.NumberFormat(c.locale, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals }).format(v)
}
