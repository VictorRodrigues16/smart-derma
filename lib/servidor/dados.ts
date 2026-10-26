import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { paraVitrine } from '@/lib/vitrine'
import {
  CHAVES_MEDIDA,
  ROTULO_MEDIDA,
  ROTULO_NIVEL,
  TIPOS_PELE,
  nivelDaNota,
  type AnaliseCompleta,
  type AnaliseResumo,
  type ChaveMedida,
  type ItemRotina,
  type Medida,
  type MetricasLoja,
  type ProdutoVitrine,
  type Respostas,
  type SessaoPublica,
  type StatusAnalise,
  type TipoPele,
  type Turno,
} from '@/lib/tipos'

/**
 * Leituras para as páginas (Server Components). Toda página chama a
 * guarda (lib/servidor/guarda.ts) antes e passa a sessão para cá quando
 * o dado depende de quem pede.
 */

export { paraVitrine }

/* Produtos ------------------------------------------------------------ */

export async function listarProdutos(opcoes: { incluirInativos?: boolean } = {}): Promise<ProdutoVitrine[]> {
  const produtos = await prisma.produto.findMany({
    where: opcoes.incluirInativos ? {} : { ativo: true },
    orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
  })
  return produtos.map(paraVitrine)
}

export async function obterProduto(id: string): Promise<ProdutoVitrine | null> {
  const p = await prisma.produto.findUnique({ where: { id } })
  return p ? paraVitrine(p) : null
}

/* Análises ------------------------------------------------------------ */

function lerMedidas(json: Prisma.JsonValue | null): Medida[] {
  if (!Array.isArray(json)) return []
  const lidas = json as unknown as Medida[]
  return CHAVES_MEDIDA.map((chave) => lidas.find((m) => m.chave === chave)).filter((m): m is Medida => Boolean(m))
}

function destaqueDe(medidas: Medida[]): string | null {
  const maior = [...medidas].sort((a, b) => b.nota - a.nota)[0]
  if (!maior || maior.nota < 20) return null
  return `${ROTULO_MEDIDA[maior.chave]} ${ROTULO_NIVEL[nivelDaNota(maior.nota)]}`
}

const incluirResumo = {
  _count: { select: { recomendacoes: true } },
  usuario: { select: { nome: true, email: true } },
} satisfies Prisma.AnaliseInclude

function paraResumo(
  a: Prisma.AnaliseGetPayload<{ include: typeof incluirResumo }>,
  comCliente: boolean,
): AnaliseResumo {
  return {
    id: a.id,
    criadoEm: a.criadoEm.toISOString(),
    status: a.status as StatusAnalise,
    tipoPele: (a.tipoPele as TipoPele | null) ?? null,
    destaque: a.status === 'concluida' ? destaqueDe(lerMedidas(a.medidas)) : null,
    totalProdutos: a._count.recomendacoes,
    ...(comCliente ? { cliente: { nome: a.usuario.nome, email: a.usuario.email } } : {}),
  }
}

/** Histórico de quem está logado (mais recentes primeiro). */
export async function listarAnalisesDoUsuario(usuarioId: string, limite = 30): Promise<AnaliseResumo[]> {
  const analises = await prisma.analise.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: 'desc' },
    take: limite,
    include: incluirResumo,
  })
  return analises.map((a) => paraResumo(a, false))
}

/**
 * Análise completa para a tela de resultado. A pessoa só vê as próprias;
 * a conta da loja vê todas. Devolve null quando não existe ou não pode ver.
 */
export async function obterAnalise(id: string, sessao: SessaoPublica): Promise<AnaliseCompleta | null> {
  const a = await prisma.analise.findUnique({
    where: { id },
    include: {
      recomendacoes: { include: { produto: true }, orderBy: { ordem: 'asc' } },
      usuario: { select: { nome: true } },
    },
  })
  if (!a) return null
  const dono = a.usuarioId === sessao.id
  if (sessao.papel !== 'loja' && !dono) return null

  const produtos: ItemRotina[] = a.recomendacoes.map((r) => ({
    produto: paraVitrine(r.produto),
    turno: r.turno as Turno,
    ordem: r.ordem,
    motivo: r.motivo,
  }))

  return {
    id: a.id,
    criadoEm: a.criadoEm.toISOString(),
    status: a.status as StatusAnalise,
    respostas: a.respostas as unknown as Respostas,
    tipoPele: (a.tipoPele as TipoPele | null) ?? null,
    resumo: a.resumo,
    medidas: lerMedidas(a.medidas),
    pontosDeAtencao: a.pontosDeAtencao,
    sugerirDermatologista: a.sugerirDermatologista,
    motivoRecusa: a.motivoRecusa,
    orientacaoFoto: a.orientacaoFoto,
    rotina: {
      manha: produtos.filter((p) => p.turno === 'manha' || p.turno === 'ambos'),
      noite: produtos.filter((p) => p.turno === 'noite' || p.turno === 'ambos'),
    },
    produtos,
    totalCentavos: produtos.reduce((soma, p) => soma + p.produto.precoCentavos, 0),
    avaliacao: a.avaliacao === 1 || a.avaliacao === -1 ? a.avaliacao : null,
    comentarioAvaliacao: a.comentarioAvaliacao,
    podeAvaliar: dono && a.status === 'concluida',
    cliente: dono ? null : { nome: a.usuario.nome },
  }
}

/* Painel da loja ------------------------------------------------------ */

/** Preço do Claude Opus 5.5 por milhão de tokens (entrada, saída, cache lido). */
const PRECO_POR_MILHAO = { entrada: 4, saida: 20, cacheLido: 0.2 }

function diaEmSaoPaulo(data: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(data)
}

export async function metricasLoja(): Promise<MetricasLoja> {
  const agora = new Date()
  const inicioHoje = new Date(`${diaEmSaoPaulo(agora)}T00:00:00-03:00`)
  const seteDias = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
  const catorzeDias = new Date(agora.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    analisesHoje,
    analises7Dias,
    analisesTotal,
    fotosRecusadas,
    tipos,
    concluidas,
    indicados,
    acertou,
    errou,
    recentes,
    tokens,
    ultimas,
  ] = await Promise.all([
    prisma.analise.count({ where: { criadoEm: { gte: inicioHoje } } }),
    prisma.analise.count({ where: { criadoEm: { gte: seteDias } } }),
    prisma.analise.count(),
    prisma.analise.count({ where: { status: 'foto_recusada' } }),
    prisma.analise.groupBy({ by: ['tipoPele'], where: { status: 'concluida' }, _count: { _all: true } }),
    prisma.analise.findMany({ where: { status: 'concluida' }, select: { medidas: true }, orderBy: { criadoEm: 'desc' }, take: 500 }),
    prisma.recomendacao.groupBy({ by: ['produtoId'], _count: { _all: true }, orderBy: { _count: { produtoId: 'desc' } }, take: 5 }),
    prisma.analise.count({ where: { avaliacao: 1 } }),
    prisma.analise.count({ where: { avaliacao: -1 } }),
    prisma.analise.findMany({ where: { criadoEm: { gte: catorzeDias } }, select: { criadoEm: true } }),
    prisma.analise.aggregate({ _sum: { tokensEntrada: true, tokensSaida: true, tokensCacheLidos: true } }),
    prisma.analise.findMany({ orderBy: { criadoEm: 'desc' }, take: 8, include: incluirResumo }),
  ])

  const somas = new Map<ChaveMedida, { soma: number; n: number }>()
  for (const { medidas } of concluidas) {
    for (const m of lerMedidas(medidas)) {
      const atual = somas.get(m.chave) ?? { soma: 0, n: 0 }
      somas.set(m.chave, { soma: atual.soma + m.nota, n: atual.n + 1 })
    }
  }

  const produtosIndicados = await prisma.produto.findMany({ where: { id: { in: indicados.map((i) => i.produtoId) } } })

  const porDia = new Map<string, number>()
  for (let d = 13; d >= 0; d--) porDia.set(diaEmSaoPaulo(new Date(agora.getTime() - d * 24 * 60 * 60 * 1000)), 0)
  for (const { criadoEm } of recentes) {
    const dia = diaEmSaoPaulo(criadoEm)
    if (porDia.has(dia)) porDia.set(dia, (porDia.get(dia) ?? 0) + 1)
  }

  const custo =
    ((tokens._sum.tokensEntrada ?? 0) * PRECO_POR_MILHAO.entrada +
      (tokens._sum.tokensSaida ?? 0) * PRECO_POR_MILHAO.saida +
      (tokens._sum.tokensCacheLidos ?? 0) * PRECO_POR_MILHAO.cacheLido) /
    1_000_000

  return {
    analisesHoje,
    analises7Dias,
    analisesTotal,
    fotosRecusadas,
    tiposPele: TIPOS_PELE.map((tipo) => ({
      tipo,
      total: tipos.find((t) => t.tipoPele === tipo)?._count._all ?? 0,
    })),
    mediasMedidas: CHAVES_MEDIDA.map((chave) => {
      const s = somas.get(chave)
      return { chave, media: s && s.n ? Math.round(s.soma / s.n) : 0 }
    }),
    produtosMaisIndicados: indicados
      .map((i) => {
        const p = produtosIndicados.find((x) => x.id === i.produtoId)
        return p ? { produto: paraVitrine(p), vezes: i._count._all } : null
      })
      .filter((x): x is { produto: ProdutoVitrine; vezes: number } => Boolean(x)),
    avaliacoes: { acertou, errou },
    porDia: [...porDia.entries()].map(([data, total]) => ({ data, total })),
    custoIaDolares: Math.round(custo * 100) / 100,
    ultimas: ultimas.map((a) => paraResumo(a, true)),
  }
}
