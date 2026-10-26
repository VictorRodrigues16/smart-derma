import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { erroJson } from '@/lib/servidor/guarda'
import { ipDaRequisicao, tentativaPermitida } from '@/lib/servidor/limitador'
import { criarSessao, destinoDoPapel } from '@/lib/servidor/sessao'

const Corpo = z.object({
  nome: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  senha: z.string().min(8).max(200),
})

export async function POST(req: Request) {
  const corpo = Corpo.safeParse(await req.json().catch(() => null))
  if (!corpo.success) {
    const campo = corpo.error.issues[0]?.path[0]
    if (campo === 'senha') return erroJson('A senha precisa ter pelo menos 8 caracteres.', 400)
    if (campo === 'email') return erroJson('Esse e-mail não parece válido.', 400)
    return erroJson('Diga seu nome para criarmos a conta.', 400)
  }
  const { nome, email, senha } = corpo.data

  // Cadastro em massa a partir do mesmo endereço é robô.
  const freio = await tentativaPermitida('cadastro', await ipDaRequisicao(), 6, 60)
  if (!freio.permitido) return erroJson(`Muitos cadastros seguidos. Espere ${freio.minutos} min.`, 429)

  const existe = await prisma.usuario.findUnique({ where: { email }, select: { id: true } })
  if (existe) return erroJson('Já existe uma conta com esse e-mail. Entre com ela.', 409)

  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash: await bcrypt.hash(senha, 10), papel: 'cliente' },
  })
  await criarSessao({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel: 'cliente' })
  return NextResponse.json({ ok: true, destino: destinoDoPapel('cliente') })
}
