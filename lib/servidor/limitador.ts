import 'server-only'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * Freios.
 *
 * 1. Login: conta tentativas no banco (vale para todas as instâncias), por
 *    e-mail e por IP. Só o e-mail não basta: testar uma senha fraca contra
 *    mil e-mails nunca esbarraria em teto nenhum.
 * 2. Análises: cada análise chama a IA e custa dinheiro. Tem teto por
 *    pessoa por hora e teto geral por dia, para uma conta aberta ou um
 *    script não esvaziar o crédito da chave.
 */

type Veredito = { permitido: true } | { permitido: false; minutos: number }

async function contar(chave: string, teto: number, janelaMin: number): Promise<Veredito> {
  const agora = new Date()
  const registro = await prisma.tentativaAcesso.findUnique({ where: { chave } })

  if (!registro || registro.ate <= agora) {
    const ate = new Date(agora.getTime() + janelaMin * 60_000)
    await prisma.tentativaAcesso.upsert({
      where: { chave },
      create: { chave, tentativas: 1, ate },
      update: { tentativas: 1, ate },
    })
    return { permitido: true }
  }

  if (registro.tentativas >= teto) {
    return {
      permitido: false,
      minutos: Math.max(1, Math.ceil((registro.ate.getTime() - agora.getTime()) / 60_000)),
    }
  }

  await prisma.tentativaAcesso.update({ where: { chave }, data: { tentativas: { increment: 1 } } })
  return { permitido: true }
}

export async function ipDaRequisicao() {
  const h = await headers()
  const encaminhado = h.get('x-forwarded-for')
  if (encaminhado) return encaminhado.split(',')[0].trim()
  return h.get('x-real-ip') ?? 'desconhecido'
}

export async function tentativaPermitida(escopo: string, identificador: string, teto = 8, janelaMin = 15) {
  const ip = await ipDaRequisicao()
  const porIdentificador = await contar(`${escopo}:id:${identificador}`, teto, janelaMin)
  if (!porIdentificador.permitido) return porIdentificador
  return contar(`${escopo}:ip:${ip}`, teto * 4, janelaMin)
}

export async function limparTentativas(escopo: string, identificador: string) {
  await prisma.tentativaAcesso.delete({ where: { chave: `${escopo}:id:${identificador}` } }).catch(() => {})
}

function inteiroDoAmbiente(nome: string, padrao: number) {
  const valor = Number.parseInt(process.env[nome] ?? '', 10)
  return Number.isFinite(valor) && valor > 0 ? valor : padrao
}

/** Pode fazer mais uma análise agora? Devolve a mensagem para a tela quando não. */
export async function analisePermitida(usuarioId: string): Promise<{ permitido: true } | { permitido: false; erro: string }> {
  const porHora = inteiroDoAmbiente('LIMITE_ANALISES_HORA', 8)
  const porDia = inteiroDoAmbiente('LIMITE_ANALISES_DIA', 300)

  const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000)
  const inicioDoDia = new Date()
  inicioDoDia.setHours(0, 0, 0, 0)

  const [daPessoa, doDia] = await Promise.all([
    prisma.analise.count({ where: { usuarioId, criadoEm: { gte: umaHoraAtras } } }),
    prisma.analise.count({ where: { criadoEm: { gte: inicioDoDia } } }),
  ])

  if (daPessoa >= porHora) {
    return { permitido: false, erro: `Você já fez ${porHora} análises na última hora. Tente de novo mais tarde.` }
  }
  if (doDia >= porDia) {
    return { permitido: false, erro: 'O limite de análises de hoje foi atingido. Volte amanhã.' }
  }
  return { permitido: true }
}
