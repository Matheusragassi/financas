import { cn } from "@/lib/utils"

/** Marca do app: barras pixeladas sobre o Blue Period */
export function AppLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn("size-8 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="al-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B9BFF" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#2557C7" />
        </linearGradient>
        <linearGradient id="al-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#al-g)" />
      <rect width="512" height="512" rx="116" fill="url(#al-s)" />
      <g fill="#fff">
        <rect x="113" y="295" width="52" height="104" rx="6" />
        <rect x="230" y="217" width="52" height="182" rx="6" />
        <rect x="347" y="139" width="52" height="260" rx="6" />
      </g>
      <g fill="#fff" opacity=".55">
        <rect x="113" y="230" width="52" height="52" rx="6" />
        <rect x="230" y="152" width="52" height="52" rx="6" />
        <rect x="347" y="74" width="52" height="52" rx="6" />
      </g>
    </svg>
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
