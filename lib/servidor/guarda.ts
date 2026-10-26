import 'server-only'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { lerSessao } from './sessao'
import type { SessaoPublica } from '@/lib/tipos'

/**
 * Porteiro único. O proxy.ts só confere se o cookie existe (barato, roda
 * antes da página); a conferência de verdade (assinatura, conta ativa e
 * papel) acontece aqui, em toda página e em toda rota da API.
 */

/* Páginas: redirecionam ------------------------------------------------ */

export async function exigirSessao(): Promise<SessaoPublica> {
  const sessao = await lerSessao()
  if (!sessao) redirect('/entrar')
  return sessao
}

export async function exigirCliente(): Promise<SessaoPublica> {
  const sessao = await exigirSessao()
  if (sessao.papel !== 'cliente') redirect('/loja')
  return sessao
}

export async function exigirLoja(): Promise<SessaoPublica> {
  const sessao = await exigirSessao()
  if (sessao.papel !== 'loja') redirect('/app')
  return sessao
}

/* API: devolvem JSON --------------------------------------------------- */

type Resultado = { ok: true; sessao: SessaoPublica } | { ok: false; resposta: NextResponse }

export async function sessaoDaApi(papel?: SessaoPublica['papel']): Promise<Resultado> {
  const sessao = await lerSessao()
  if (!sessao) {
    return {
      ok: false,
      resposta: NextResponse.json({ ok: false, erro: 'Sua sessão terminou. Entre de novo.' }, { status: 401 }),
    }
  }
  if (papel && sessao.papel !== papel) {
    return {
      ok: false,
      resposta: NextResponse.json({ ok: false, erro: 'Esta conta não tem acesso a isso.' }, { status: 403 }),
    }
  }
  return { ok: true, sessao }
}

export function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ ok: false, erro: mensagem }, { status })
}
