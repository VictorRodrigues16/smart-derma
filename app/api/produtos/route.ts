import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { erroJson, sessaoDaApi } from '@/lib/servidor/guarda'
import { ProdutoEntradaSchema } from '@/lib/tipos'

export async function POST(req: Request) {
  const acesso = await sessaoDaApi('loja')
  if (!acesso.ok) return acesso.resposta

  const corpo = ProdutoEntradaSchema.safeParse(await req.json().catch(() => null))
  if (!corpo.success) {
    const problema = corpo.error.issues[0]
    return erroJson(`Confira o campo "${String(problema?.path[0] ?? '')}": ${problema?.message ?? 'valor inválido'}`, 400)
  }

  try {
    const produto = await prisma.produto.create({ data: corpo.data })
    return NextResponse.json({ ok: true, id: produto.id })
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
      return erroJson('Já existe um produto com esse código.', 409)
    }
    throw erro
  }
}
