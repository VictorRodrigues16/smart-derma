import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { erroJson, sessaoDaApi } from '@/lib/servidor/guarda'

const Corpo = z.object({
  nota: z.union([z.literal(1), z.literal(-1)]),
  comentario: z.string().trim().max(500).optional(),
})

/** "A análise acertou?": é o termômetro de qualidade da IA no painel da loja. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const acesso = await sessaoDaApi()
  if (!acesso.ok) return acesso.resposta

  const corpo = Corpo.safeParse(await req.json().catch(() => null))
  if (!corpo.success) return erroJson('Escolha se a análise acertou ou não.', 400)

  const { id } = await params
  const analise = await prisma.analise.findUnique({ where: { id }, select: { usuarioId: true, status: true } })
  if (!analise || analise.usuarioId !== acesso.sessao.id) return erroJson('Análise não encontrada.', 404)
  if (analise.status !== 'concluida') return erroJson('Só dá para avaliar uma análise concluída.', 400)

  await prisma.analise.update({
    where: { id },
    data: { avaliacao: corpo.data.nota, comentarioAvaliacao: corpo.data.comentario || null },
  })
  return NextResponse.json({ ok: true })
}
