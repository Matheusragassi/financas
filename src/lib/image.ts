/** Reduz uma imagem para um quadrado (recorte central) e devolve JPEG em data URL */
export function resizeImage(file: File, size = 192, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Escolha um arquivo de imagem."))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const canvas = document.createElement("canvas")
      canvas.width = canvas.height = size
      const ctx = canvas.getContext("2d")!
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/jpeg", quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler a imagem.")) }
    img.src = url
  })
}
