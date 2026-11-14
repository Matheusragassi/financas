/**
 * ID do cliente OAuth do Google (é público, não é segredo).
 * Crie em console.cloud.google.com → Credenciais → ID do cliente OAuth (Aplicativo da Web).
 */
export const GOOGLE_CLIENT_ID: string =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || "511633984628-ms0kmd3akj0ho4b6k1mr9ormsgkmfakk.apps.googleusercontent.com"

/** drive.file: o app só enxerga os arquivos que ele mesmo criou no Drive do usuário */
export const GOOGLE_SCOPES = "openid email profile https://www.googleapis.com/auth/drive.file"

export const googleEnabled = () => GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")
