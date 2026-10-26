import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { analisarPele } from '@/lib/ia/analisar'
import { RespostasSchema, type RespostaCriarAnalise } from '@/lib/tipos'
import { paraVitrine } from '@/lib/vitrine'
import { FotoInvalida, prepararFotoParaIA } from './foto'
import { analisePermitida } from './limitador'

/**
 * Do formulário até o banco:
 * consentimento → respostas → freio de custo → foto limpa → IA → grava.
 *
 * Toda tentativa que chega na IA é gravada (inclusive foto recusada e
 * erro): ela custou tokens, conta no freio e aparece nas métricas.
 */

type Entrada = {
  usuarioId: string
  foto: File | null
  respostasJson: string | null
  consentimento: string | null
}

export type Retorno = { status: number; corpo: RespostaCriarAnalise }

function falha(status: number, erro: string): Retorno {
  return { status, corpo: { ok: false, erro } }
}

export async function criarAnalise(entrada: Entrada): Promise<Retorno> {
  if (entrada.consentimento !== 'sim') {
    return falha(400, 'Para analisar, precisamos que você autorize o uso da foto.')
  }

  let respostasBrutas: unknown
  try {
    respostasBrutas = JSON.parse(entrada.respostasJson ?? '')
  } catch {
    return falha(400, 'As respostas do questionário não chegaram. Volte e responda de novo.')
  }
  const respostas = RespostasSchema.safeParse(respostasBrutas)
  if (!respostas.success) {
    return falha(400, 'Faltou responder alguma pergunta. Volte e confira.')
  }

  if (!entrada.foto || entrada.foto.size === 0) {
    return falha(400, 'A foto não chegou. Tire ou escolha a foto de novo.')
  }

  const freio = await analisePermitida(entrada.usuarioId)
  if (!freio.permitido) return falha(429, freio.erro)

  let base64: string
  try {
    base64 = (await prepararFotoParaIA(Buffer.from(await entrada.foto.arrayBuffer()))).base64
  } catch (erro) {
    if (erro instanceof FotoInvalida) return falha(400, erro.message)
    throw erro
  }

  const catalogo = (await prisma.produto.findMany({ where: { ativo: true } })).map(paraVitrine)
  const resultado = await analisarPele({ foto: { tipo: 'base64', jpeg: base64 }, respostas: respostas.data, catalogo })

  const comum = {
    usuarioId: entrada.usuarioId,
    respostas: respostas.data as unknown as Prisma.InputJsonValue,
    consentimentoEm: new Date(),
    modelo: resultado.uso?.modelo ?? null,
    tokensEntrada: resultado.uso?.tokensEntrada ?? 0,
    tokensSaida: resultado.uso?.tokensSaida ?? 0,
    tokensCacheLidos: resultado.uso?.tokensCacheLidos ?? 0,
    duracaoMs: resultado.uso?.duracaoMs ?? 0,
  }

  if (resultado.tipo === 'erro') {
    console.error('[analise] falha da IA:', resultado.detalhe)
    await prisma.analise.create({ data: { ...comum, status: 'erro', motivoRecusa: resultado.detalhe.slice(0, 500) } })
    return falha(502, resultado.mensagem)
  }

  if (resultado.tipo === 'foto_recusada') {
    const analise = await prisma.analise.create({
      data: { ...comum, status: 'foto_recusada', motivoRecusa: resultado.motivo, orientacaoFoto: resultado.orientacao },
    })
    return {
      status: 200,
      corpo: { ok: true, id: analise.id, status: 'foto_recusada', motivo: resultado.motivo, orientacao: resultado.orientacao },
    }
  }

  const analise = await prisma.analise.create({
    data: {
      ...comum,
      status: 'concluida',
      tipoPele: resultado.tipoPele,
      resumo: resultado.resumo,
      medidas: resultado.medidas as unknown as Prisma.InputJsonValue,
      pontosDeAtencao: resultado.pontosDeAtencao,
      sugerirDermatologista: resultado.sugerirDermatologista,
      recomendacoes: {
        create: resultado.itens.map((item) => ({
          produtoId: item.produto.id,
          turno: item.turno,
          ordem: item.ordem,
          motivo: item.motivo,
        })),
      },
    },
  })

  return { status: 200, corpo: { ok: true, id: analise.id, status: 'concluida' } }
}
