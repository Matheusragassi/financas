export interface Currency { code: string; name: string; locale: string; flag: string; symbol: string; decimals: number }

export const CURRENCIES: Currency[] = [
  { code: "BRL", name: "Real brasileiro", locale: "pt-BR", flag: "🇧🇷", symbol: "R$", decimals: 2 },
  { code: "USD", name: "Dólar americano", locale: "en-US", flag: "🇺🇸", symbol: "US$", decimals: 2 },
  { code: "EUR", name: "Euro", locale: "de-DE", flag: "🇪🇺", symbol: "€", decimals: 2 },
  { code: "GBP", name: "Libra esterlina", locale: "en-GB", flag: "🇬🇧", symbol: "£", decimals: 2 },
  { code: "CAD", name: "Dólar canadense", locale: "en-CA", flag: "🇨🇦", symbol: "C$", decimals: 2 },
  { code: "ARS", name: "Peso argentino", locale: "es-AR", flag: "🇦🇷", symbol: "$", decimals: 2 },
  { code: "CLP", name: "Peso chileno", locale: "es-CL", flag: "🇨🇱", symbol: "$", decimals: 0 },
  { code: "MXN", name: "Peso mexicano", locale: "es-MX", flag: "🇲🇽", symbol: "$", decimals: 2 },
  { code: "JPY", name: "Iene japonês", locale: "ja-JP", flag: "🇯🇵", symbol: "¥", decimals: 0 },
]

export const currencyOf = (code?: string) => CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
