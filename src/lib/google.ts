import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from "./config"

/* Login Google 100% no navegador (Google Identity Services, fluxo de token). */

interface TokenResponse { access_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string }
interface TokenClient { requestAccessToken: (o?: { prompt?: string; login_hint?: string }) => void; callback: (r: TokenResponse) => void }
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type: string }) => void }) => TokenClient
          revoke: (token: string, done?: () => void) => void
          hasGrantedAllScopes: (r: TokenResponse, ...scopes: string[]) => boolean
        }
      }
    }
  }
}

export class AuthError extends Error {}
/** O usuário entrou, mas não marcou a permissão do Google Drive na tela do Google */
export class ScopeError extends AuthError {}
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"
export const SCOPE_MESSAGE = "Falta a permissão do Google Drive. Na tela do Google, marque a caixa “Ver, editar, criar e excluir arquivos do Google Drive usados com este app”."

const TOKEN_KEY = "financas-google-token"
let scriptPromise: Promise<void> | null = null
let client: TokenClient | null = null
let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null

function loadScript() {
  if (window.google?.accounts) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = "https://accounts.google.com/gsi/client"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => { scriptPromise = null; reject(new Error("Não foi possível carregar o login do Google (sem internet?).")) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

function readToken(): { token: string; exp: number } | null {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "null")
    return t && t.exp > Date.now() + 60_000 ? t : null
  } catch { return null }
}

export const hasValidToken = () => !!readToken()
export const currentToken = () => readToken()?.token ?? null

/** Abre o login do Google. prompt "" tenta reconectar sem perguntar de novo. */
export async function requestToken(prompt: "" | "consent" | "select_account" = "", loginHint?: string): Promise<string> {
  await loadScript()
  client ??= window.google!.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: GOOGLE_SCOPES,
    callback: (r) => {
      const p = pending; pending = null
      if (!p) return
      if (r.error || !r.access_token) return p.reject(new AuthError(r.error_description || r.error || "Login cancelado"))
      // Consentimento granular: a pessoa pode ter desmarcado o Drive
      const granted = window.google!.accounts.oauth2.hasGrantedAllScopes?.(r, DRIVE_SCOPE) ?? (r.scope ? r.scope.split(" ").includes(DRIVE_SCOPE) : true)
      if (!granted) return p.reject(new ScopeError(SCOPE_MESSAGE))
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: r.access_token, exp: Date.now() + (r.expires_in ?? 3600) * 1000 }))
      p.resolve(r.access_token)
    },
    error_callback: (e) => {
      const p = pending; pending = null
      p?.reject(new AuthError(e.type === "popup_closed" ? "Janela de login fechada" : e.type === "popup_failed_to_open" ? "O navegador bloqueou a janela de login" : "Falha no login"))
    },
  })
  pending?.reject(new AuthError("Substituído por nova tentativa"))
  return new Promise<string>((resolve, reject) => {
    pending = { resolve, reject }
    client!.requestAccessToken({ prompt, login_hint: loginHint })
  })
}

export function signOutGoogle() {
  const t = currentToken()
  localStorage.removeItem(TOKEN_KEY)
  if (t && window.google?.accounts) window.google.accounts.oauth2.revoke(t)
}

/** fetch autenticado nas APIs do Google */
export async function gfetch<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const token = currentToken()
  if (!token) throw new AuthError("Sessão do Google expirada")
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
  })
  if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); throw new AuthError("Sessão do Google expirada") }
  if (res.status === 403) {
    let msg = ""
    try { msg = (await res.clone().json()).error?.message ?? "" } catch { /* sem corpo */ }
    if (/insufficient authentication scopes|insufficientPermissions|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(msg)) {
      localStorage.removeItem(TOKEN_KEY)
      throw new ScopeError(SCOPE_MESSAGE)
    }
  }
  if (!res.ok) {
    let msg = `Erro ${res.status} do Google`
    try { msg = (await res.json()).error?.message ?? msg } catch { /* sem corpo */ }
    throw new Error(msg)
  }
  return (res.status === 204 ? null : await res.json()) as T
}

export interface GoogleUser { email: string; name: string; picture?: string }
export const fetchUser = () => gfetch<GoogleUser>("https://www.googleapis.com/oauth2/v3/userinfo")
