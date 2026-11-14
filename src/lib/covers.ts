/** Capas do perfil (gradientes da paleta MAVI) */
export const COVERS = [
  { id: "blue", name: "Blue Period", css: "linear-gradient(120deg,#2557C7,#3B82F6 45%,#7DD3FC)" },
  { id: "aurora", name: "Aurora", css: "linear-gradient(120deg,#3B82F6,#34D399 55%,#9BE858)" },
  { id: "dusk", name: "Crepúsculo", css: "linear-gradient(120deg,#6D28D9,#A78BFA 50%,#FF8E56)" },
  { id: "sunset", name: "Outono", css: "linear-gradient(120deg,#FF8E56,#F4607A 60%,#A78BFA)" },
  { id: "night", name: "Noite", css: "linear-gradient(120deg,#0F172A,#101827 50%,#3B82F6)" },
]
export const COVER_CSS: Record<string, string> = Object.fromEntries(COVERS.map((c) => [c.id, c.css]))
