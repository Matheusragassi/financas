/** Capas do perfil (gradientes da paleta MAVI) */
export const COVERS = [
  { id: "blue", name: "Azul Gastu", css: "linear-gradient(120deg,#1230C4,#1A3FEB 45%,#5C7BFF)" },
  { id: "aurora", name: "Aurora", css: "linear-gradient(120deg,#1A3FEB,#34D399 55%,#C6FF3D)" },
  { id: "dusk", name: "Crepúsculo", css: "linear-gradient(120deg,#6D28D9,#A78BFA 50%,#FF8E56)" },
  { id: "sunset", name: "Outono", css: "linear-gradient(120deg,#FF8E56,#F4607A 60%,#A78BFA)" },
  { id: "night", name: "Noite", css: "linear-gradient(120deg,#0B0F1A,#141A28 50%,#1A3FEB)" },
]
export const COVER_CSS: Record<string, string> = Object.fromEntries(COVERS.map((c) => [c.id, c.css]))
