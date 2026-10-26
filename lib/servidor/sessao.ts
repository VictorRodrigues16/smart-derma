import 'server-only'
import { hkdfSync } from 'node:crypto'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import type { Papel, SessaoPublica } from '@/lib/tipos'

/**
 * Sessão em cookie httpOnly assinado (HS256). O navegador nunca lê o
 * token; a tela pergunta ao servidor quem está logado.
 */

const COOKIE = 'smartderma-sessao'
const DURACAO_DIAS = 7
const EMISSOR = 'smart-derma'

function chave() {
  const segredo = process.env.SESSAO_SEGREDO
  if (!segredo || segredo.length < 24) {
    throw new Error('SESSAO_SEGREDO ausente ou curto demais (mínimo 24 caracteres)')
  }
  return new Uint8Array(hkdfSync('sha256', segredo, EMISSOR, 'sessao', 32))
}

export async function criarSessao(usuario: SessaoPublica) {
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000)

  const token = await new SignJWT({ papel: usuario.papel })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(usuario.id)
    .setIssuedAt()
    .setIssuer(EMISSOR)
    .setExpirationTime(expira)
    .sign(chave())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expira,
    path: '/',
  })
}

/**
 * Lê e confere a sessão. Além da assinatura, confere no banco se a conta
 * ainda existe e está ativa: desativar alguém derruba a sessão na hora.
 */
export async function lerSessao(): Promise<SessaoPublica | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, chave(), { issuer: EMISSOR, algorithms: ['HS256'] })
    if (!payload.sub) return null

    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, nome: true, email: true, papel: true, ativo: true },
    })
    if (!usuario?.ativo) return null

    return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel as Papel }
  } catch {
    return null
  }
}

export async function encerrarSessao() {
  ;(await cookies()).delete(COOKIE)
}

/** Para onde cada papel vai depois de entrar. */
export function destinoDoPapel(papel: Papel) {
  return papel === 'loja' ? '/loja' : '/app'
}

export const NOME_COOKIE_SESSAO = COOKIE
