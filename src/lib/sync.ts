import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthError, fetchUser, hasValidToken, requestToken, signOutGoogle, type GoogleUser } from "./google"
import { createDataFile, findDataFile, getFileMeta, getRemoteRev, readData, writeData } from "./sheet-db"
import { useStore } from "./store"
import { googleEnabled } from "./config"
import type { Backup } from "./types"

/*
 * Sincronização com a planilha do Google Drive do usuário.
 * - Os dados ficam também no aparelho (funciona offline).
 * - Cada alteração marca "dirty" e é enviada após alguns segundos.
 * - Ao abrir/voltar ao app, puxa a versão da planilha se ela mudou em outro aparelho.
 */

export type SyncStatus = "off" | "connecting" | "syncing" | "synced" | "offline" | "needs-auth" | "error" | "conflict"

interface SyncState {
  user: GoogleUser | null
  fileId: string | null
  fileUrl: string | null
  /** versão (rev) da planilha na última sincronização */
  remoteVersion: string | null
  dirty: boolean
  status: SyncStatus
  error: string
  lastSyncAt: string | null
  conflict: Backup | null
}

export const useSync = create<SyncState>()(
  persist(
    (): SyncState => ({ user: null, fileId: null, fileUrl: null, remoteVersion: null, dirty: false, status: "off", error: "", lastSyncAt: null, conflict: null }),
    { name: "financas-sync", partialize: (s) => ({ user: s.user, fileId: s.fileId, fileUrl: s.fileUrl, remoteVersion: s.remoteVersion, dirty: s.dirty, lastSyncAt: s.lastSyncAt }) },
  ),
)

const set = useSync.setState
const get = useSync.getState
let applyingRemote = false
let timer: ReturnType<typeof setTimeout> | undefined
let running: Promise<void> | null = null

const localBackup = () => useStore.getState().exportBackup()
const hasLocalData = () => { const s = useStore.getState(); return s.initialized && !s.isDemo && (s.expenses.length > 0 || s.months.length > 0) }

function applyRemote(b: Backup) {
  applyingRemote = true
  if (b.expenses.length || b.months.length) useStore.getState().importBackup(b)
  applyingRemote = false
}

function fail(e: unknown) {
  if (e instanceof AuthError) set({ status: "needs-auth", error: e.message })
  else if (!navigator.onLine) set({ status: "offline", error: "" })
  else set({ status: "error", error: (e as Error).message })
}

async function push() {
  const { fileId } = get()
  if (!fileId) return
  set({ status: "syncing" })
  const rev = await writeData(fileId, localBackup())
  set({ remoteVersion: rev, dirty: false, status: "synced", lastSyncAt: new Date().toISOString(), error: "" })
}

/** Sincroniza agora: puxa se a planilha mudou, envia se há mudanças locais */
export function syncNow(): Promise<void> {
  if (running) return running
  running = (async (): Promise<void> => {
    const s = get()
    if (!s.user || !s.fileId || useStore.getState().isDemo) return
    if (!navigator.onLine) { set({ status: "offline" }); return }
    if (!hasValidToken()) { set({ status: "needs-auth" }); return }
    try {
      set({ status: "syncing" })
      const rev = await getRemoteRev(s.fileId)
      const remoteChanged = rev !== (s.remoteVersion ?? "")
      if (remoteChanged && !s.dirty) {
        const remote = await readData(s.fileId)
        applyRemote(remote)
        set({ remoteVersion: remote.rev ?? rev, status: "synced", lastSyncAt: new Date().toISOString(), error: "" })
      } else if (remoteChanged && s.dirty) {
        set({ status: "conflict", conflict: await readData(s.fileId) })
      } else if (s.dirty) {
        await push()
      } else {
        set({ status: "synced", error: "" })
      }
    } catch (e) { fail(e) }
  })().finally(() => { running = null })
  return running
}

/** Resolve conflito entre aparelhos */
export async function resolveConflict(keep: "local" | "remote") {
  const c = get().conflict
  if (keep === "remote" && c) applyRemote(c)
  set({ conflict: null, dirty: keep === "local", remoteVersion: c?.rev ?? get().remoteVersion })
  if (keep === "local") { try { await push() } catch (e) { fail(e) } } else set({ status: "synced" })
}

/** Login + localiza (ou cria) a planilha de dados */
export async function signIn() {
  set({ status: "connecting", error: "" })
  try {
    await requestToken(get().user ? "" : "select_account", get().user?.email)
    const user = await fetchUser()
    const sameUser = get().user?.email === user.email
    set({ user })
    let file = sameUser && get().fileId ? await getFileMeta(get().fileId!).catch(() => null) : null
    file ??= await findDataFile()
    if (file) {
      const remote = await readData(file.id)
      const remoteEmpty = !remote.expenses.length && !remote.months.length
      set({ fileId: file.id, fileUrl: file.webViewLink ?? null })
      if (remoteEmpty && hasLocalData()) {
        set({ dirty: true })
        await push()
      } else if (!remoteEmpty && sameUser && get().dirty && (remote.rev ?? "") !== (get().remoteVersion ?? "")) {
        set({ status: "conflict", conflict: remote })
      } else if (!remoteEmpty && (!sameUser || !get().dirty)) {
        applyRemote(remote)
        set({ remoteVersion: remote.rev ?? "", dirty: false, status: "synced", lastSyncAt: new Date().toISOString() })
      } else {
        await push()
      }
    } else {
      file = await createDataFile(useStore.getState().settings.ownerName || user.name)
      set({ fileId: file.id, fileUrl: file.webViewLink ?? null, remoteVersion: "" })
      if (hasLocalData()) { set({ dirty: true }); await push() } else set({ status: "synced" })
    }
    const st = useStore.getState()
    if (!st.settings.ownerName) st.updateSettings({ ownerName: user.name.split(" ")[0] })
  } catch (e) {
    fail(e)
    throw e
  }
}

/** Reconecta sem perguntar (usa o consentimento já dado) */
export async function reconnect() {
  try {
    await requestToken("", get().user?.email)
    await syncNow()
  } catch (e) { fail(e) }
}

export function signOut(clearLocal: boolean) {
  if (clearLocal && get().dirty && !window.confirm("Há alterações que ainda não foram salvas no Google. Sair mesmo assim e descartá-las?")) return
  signOutGoogle()
  set({ user: null, fileId: null, fileUrl: null, remoteVersion: null, dirty: false, status: "off", error: "", lastSyncAt: null, conflict: null })
  if (clearLocal) useStore.getState().resetAll()
}

let started = false
/** Liga os gatilhos automáticos (chamar uma vez) */
export function startSync() {
  if (started || !googleEnabled()) return
  started = true
  // Mudanças locais → agenda envio
  useStore.subscribe((s, prev) => {
    if (applyingRemote || s.isDemo || !get().user) return
    if (s.expenses === prev.expenses && s.months === prev.months && s.settings === prev.settings) return
    set({ dirty: true })
    clearTimeout(timer)
    timer = setTimeout(() => void syncNow(), 2500)
  })
  const kick = () => { if (get().user) void syncNow() }
  window.addEventListener("online", kick)
  window.addEventListener("focus", kick)
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") kick() })
  // Se a sessão expirou, reconecta no primeiro toque do usuário (navegadores exigem um gesto)
  document.addEventListener("pointerdown", () => {
    if (get().user && get().status === "needs-auth" && navigator.onLine) void reconnect()
  }, { capture: true })
  // Sincronização periódica com o app aberto
  setInterval(kick, 60_000)
  if (get().user) {
    if (hasValidToken()) void syncNow()
    else set({ status: navigator.onLine ? "needs-auth" : "offline" })
  }
}
