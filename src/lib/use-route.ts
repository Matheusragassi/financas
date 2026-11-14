import { useEffect, useState } from "react"

export type Route = "dashboard" | "lancamentos" | "parcelas" | "relatorios" | "ajustes" | "conta" | "cartoes"
const ROUTES: Route[] = ["dashboard", "lancamentos", "parcelas", "relatorios", "ajustes", "conta", "cartoes"]

const read = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, "") as Route
  return ROUTES.includes(h) ? h : "dashboard"
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return route
}
export const navigate = (r: Route) => { window.location.hash = `/${r}` }
