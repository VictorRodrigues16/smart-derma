/**
 * Preparação da foto no navegador, antes de subir.
 *
 * Foto de celular passa fácil de 4 MB. Reduzir aqui para ~1280 px deixa o
 * envio rápido no 4G e fica dentro do que a IA aproveita (ela reduz
 * qualquer imagem maior que isso de qualquer jeito). O servidor ainda
 * reprocessa com sharp e apaga os metadados (EXIF pode ter localização).
 */

const LADO_MAXIMO = 1280
const QUALIDADE = 0.86

async function paraJpeg(origem: CanvasImageSource, largura: number, altura: number, espelhar = false) {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(largura, altura))
  const w = Math.round(largura * escala)
  const h = Math.round(altura * escala)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu preparar a foto.')

  if (espelhar) {
    // A câmera frontal mostra a imagem espelhada; a foto sai como a pessoa se viu.
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(origem, 0, 0, w, h)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALIDADE))
  if (!blob) throw new Error('Não deu para preparar a foto. Tente outra.')
  return blob
}

/** Arquivo escolhido na galeria (ou tirado pelo input com capture) → JPEG reduzido. */
export async function prepararArquivo(arquivo: Blob): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  if (arquivo.size > 25 * 1024 * 1024) throw new Error('Essa imagem é grande demais. Escolha uma de até 25 MB.')

  let bitmap: ImageBitmap
  try {
    // imageOrientation corrige foto de celular que viria deitada.
    bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Não deu para abrir essa imagem. Tente uma foto em JPG ou PNG.')
  }
  try {
    return await paraJpeg(bitmap, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

/** Quadro atual da câmera ao vivo (<video> com o stream do getUserMedia) → JPEG. */
export async function capturarDaCamera(video: HTMLVideoElement, espelhar = true): Promise<Blob> {
  if (!video.videoWidth || !video.videoHeight) throw new Error('A câmera ainda está abrindo. Tente de novo.')
  return paraJpeg(video, video.videoWidth, video.videoHeight, espelhar)
}

/**
 * Abre a câmera frontal. Devolve null quando não há câmera ou a pessoa
 * negou a permissão; a tela então oferece "Enviar da galeria".
 */
export async function abrirCameraFrontal(): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false,
    })
  } catch {
    return null
  }
}

export function fecharCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}
