import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { erroJson, sessaoDaApi } from '@/lib/servidor/guarda'

export const runtime = 'nodejs'

const TAMANHO_MAXIMO = 8 * 1024 * 1024

/**
 * Foto de PRODUTO (nunca de rosto) para o Vercel Blob.
 *
 * O navegador já manda reduzida (lib/cliente/foto.ts); aqui ela é
 * conferida, endireitada, sem metadados e regravada em WebP de até 1000 px.
 * Devolve a URL pública para gravar em `imagemUrl` do produto.
 */
export async function POST(req: Request) {
  const acesso = await sessaoDaApi('loja')
  if (!acesso.ok) return acesso.resposta

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return erroJson('O armazenamento de imagens não está configurado neste ambiente.', 503)
  }

  let arquivo: FormDataEntryValue | null
  try {
    arquivo = (await req.formData()).get('imagem')
  } catch {
    return erroJson('O envio chegou incompleto. Tente de novo.', 400)
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) return erroJson('Escolha uma imagem.', 400)
  if (arquivo.size > TAMANHO_MAXIMO) return erroJson('Imagem grande demais. Use uma de até 8 MB.', 400)

  let webp: Buffer
  try {
    webp = await sharp(Buffer.from(await arquivo.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    return erroJson('Esse arquivo não é uma imagem que a gente consiga abrir.', 400)
  }

  const blob = await put(`produtos/${randomUUID()}.webp`, webp, {
    access: 'public',
    contentType: 'image/webp',
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  })
  return NextResponse.json({ ok: true, url: blob.url })
}
