import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CONTAS_DEMO } from '@/lib/servidor/demo'
import { erroJson } from '@/lib/servidor/guarda'
import { criarSessao, destinoDoPapel } from '@/lib/servidor/sessao'
import type { Papel } from '@/lib/tipos'

const Corpo = z.object({ perfil: z.enum(['cliente', 'loja']) })

/** Atalho de apresentação: entra numa conta de demonstração sem senha. */
export async function POST(req: Request) {
  if (process.env.DEMO_ATALHOS !== '1') return erroJson('Atalhos de demonstração desligados.', 404)

  const corpo = Corpo.safeParse(await req.json().catch(() => null))
  if (!corpo.success) return erroJson('Perfil de demonstração inválido.', 400)

  const usuario = await prisma.usuario.findUnique({ where: { email: CONTAS_DEMO[corpo.data.perfil].email } })
  if (!usuario?.ativo) return erroJson('A conta de demonstração não existe. Rode pnpm db:seed.', 503)

  const papel = usuario.papel as Papel
  await criarSessao({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel })
  return NextResponse.json({ ok: true, destino: destinoDoPapel(papel) })
}
