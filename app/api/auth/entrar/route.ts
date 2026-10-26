import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { erroJson } from '@/lib/servidor/guarda'
import { limparTentativas, tentativaPermitida } from '@/lib/servidor/limitador'
import { criarSessao, destinoDoPapel } from '@/lib/servidor/sessao'
import type { Papel } from '@/lib/tipos'

const Corpo = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  senha: z.string().min(1).max(200),
})

// Compara mesmo quando a conta não existe: o tempo de resposta não
// entrega quais e-mails têm cadastro.
const HASH_FALSO = bcrypt.hashSync('smart-derma-conta-inexistente', 10)

export async function POST(req: Request) {
  const corpo = Corpo.safeParse(await req.json().catch(() => null))
  if (!corpo.success) return erroJson('Confira o e-mail e a senha.', 400)
  const { email, senha } = corpo.data

  const freio = await tentativaPermitida('login', email)
  if (!freio.permitido) {
    return erroJson(`Muitas tentativas. Espere ${freio.minutos} min e tente de novo.`, 429)
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  const senhaCerta = await bcrypt.compare(senha, usuario?.senhaHash ?? HASH_FALSO)
  if (!usuario || !senhaCerta || !usuario.ativo) return erroJson('E-mail ou senha incorretos.', 401)

  await limparTentativas('login', email)
  const papel = usuario.papel as Papel
  await criarSessao({ id: usuario.id, nome: usuario.nome, email: usuario.email, papel })
  return NextResponse.json({ ok: true, destino: destinoDoPapel(papel) })
}
