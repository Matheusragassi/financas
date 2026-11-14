import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface Option { value: string; label: string }

export function SimpleSelect({
  value, onChange, options, placeholder, className, size, id,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  size?: "sm" | "default"
  id?: string
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onChange((v as string) ?? "")}>
      <SelectTrigger id={id} size={size} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} sideOffset={6} align="start" className="max-h-72">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
