import sharp from 'sharp'

/**
 * A foto chega do navegador já reduzida, mas o servidor não confia nisso:
 * - confere que é imagem de verdade (o tipo declarado pode mentir);
 * - endireita pela orientação do celular;
 * - apaga os metadados (EXIF pode trazer localização e modelo do aparelho);
 * - reduz para no máximo 1280 px e regrava em JPEG.
 *
 * O resultado vive só na memória desta requisição: vai para a IA e some.
 * Nada é gravado em disco nem no banco.
 */

export class FotoInvalida extends Error {}

const FORMATOS_ACEITOS = new Set(['jpeg', 'png', 'webp', 'heif', 'avif'])
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

async function lerMetadados(bytes: Buffer) {
  try {
    return await sharp(bytes, { limitInputPixels: 50_000_000 }).metadata()
  } catch {
    throw new FotoInvalida('Esse arquivo não é uma foto que a gente consiga abrir.')
  }
}

export async function prepararFotoParaIA(bytes: Buffer): Promise<{ base64: string; largura: number; altura: number }> {
  if (bytes.length === 0) throw new FotoInvalida('A foto chegou vazia. Tente de novo.')
  if (bytes.length > TAMANHO_MAXIMO_BYTES) throw new FotoInvalida('A foto é grande demais. Use uma de até 10 MB.')

  const meta = await lerMetadados(bytes)
  if (!meta.format || !FORMATOS_ACEITOS.has(meta.format)) {
    throw new FotoInvalida('Formato de imagem não aceito. Use JPG, PNG ou WebP.')
  }
  if ((meta.width ?? 0) < 320 || (meta.height ?? 0) < 320) {
    throw new FotoInvalida('A foto está pequena demais para ver a pele. Aproxime a câmera e tente de novo.')
  }

  const { data, info } = await sharp(bytes, { limitInputPixels: 50_000_000 })
    .rotate() // sem argumento: usa a orientação gravada pelo celular
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true }) // sem withMetadata(): o EXIF não vai junto
    .toBuffer({ resolveWithObject: true })

  return { base64: data.toString('base64'), largura: info.width, altura: info.height }
}
