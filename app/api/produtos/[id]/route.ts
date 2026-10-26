import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { erroJson, sessaoDaApi } from '@/lib/servidor/guarda'
import { ProdutoEntradaSchema } from '@/lib/tipos'

/**
 * Edição parcial. Produto nunca é apagado: ele pode estar em análises
 * antigas. Para tirar do catálogo, `ativo: false`.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const acesso = await sessaoDaApi('loja')
  if (!acesso.ok) return acesso.resposta

  const corpo = ProdutoEntradaSchema.partial().safeParse(await req.json().catch(() => null))
  if (!corpo.success) {
    const problema = corpo.error.issues[0]
    return erroJson(`Confira o campo "${String(problema?.path[0] ?? '')}": ${problema?.message ?? 'valor inválido'}`, 400)
  }

  const { id } = await params
  try {
    await prisma.produto.update({ where: { id }, data: corpo.data })
    return NextResponse.json({ ok: true })
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === 'P2025') return erroJson('Produto não encontrado.', 404)
      if (erro.code === 'P2002') return erroJson('Já existe um produto com esse código.', 409)
    }
    throw erro
  }
}
