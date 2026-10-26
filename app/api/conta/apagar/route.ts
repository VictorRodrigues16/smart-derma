import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CONTAS_DEMO } from '@/lib/servidor/demo'
import { erroJson, sessaoDaApi } from '@/lib/servidor/guarda'
import { limparTentativas } from '@/lib/servidor/limitador'
import { encerrarSessao } from '@/lib/servidor/sessao'

const Corpo = z.object({ escopo: z.enum(['historico', 'conta']) })

const EMAILS_DEMO = new Set<string>(Object.values(CONTAS_DEMO).map((c) => c.email))

/**
 * Direito de apagar os dados (LGPD), prometido no consentimento.
 * - historico: apaga todas as análises da pessoa (e as indicações delas).
 * - conta: apaga a conta inteira; as análises vão junto (cascade no banco).
 * A foto nunca foi guardada, então não há foto para apagar.
 */
export async function POST(req: Request) {
  const acesso = await sessaoDaApi('cliente')
  if (!acesso.ok) return acesso.resposta

  const corpo = Corpo.safeParse(await req.json().catch(() => null))
  if (!corpo.success) return erroJson('Pedido inválido.', 400)
  const { sessao } = acesso

  if (corpo.data.escopo === 'historico') {
    await prisma.analise.deleteMany({ where: { usuarioId: sessao.id } })
    return NextResponse.json({ ok: true })
  }

  if (EMAILS_DEMO.has(sessao.email)) {
    return erroJson('A conta de demonstração é compartilhada e não pode ser excluída. O histórico pode ser apagado.', 403)
  }

  await prisma.usuario.delete({ where: { id: sessao.id } })
  await limparTentativas('login', sessao.email)
  await encerrarSessao()
  return NextResponse.json({ ok: true, destino: '/entrar' })
}
