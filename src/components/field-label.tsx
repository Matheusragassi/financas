import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/** Rótulo de campo: obrigatório (*) ou opcional */
export function FieldLabel({ htmlFor, children, required, optional, className }: {
  htmlFor?: string; children: React.ReactNode; required?: boolean; optional?: boolean; className?: string
}) {
  return (
    <Label htmlFor={htmlFor} className={cn("gap-1", className)}>
      {children}
      {required && <span className="text-critical" aria-hidden="true">*</span>}
      {required && <span className="sr-only">(obrigatório)</span>}
      {optional && <span className="font-normal text-muted-foreground">(opcional)</span>}
    </Label>
  )
}
