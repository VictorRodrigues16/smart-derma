/**
 * Tipos e rótulos compartilhados entre servidor e telas.
 *
 * Este arquivo não importa nada de servidor (Prisma, cookies, SDK), então
 * pode ser usado em componente de cliente sem levar segredo para o navegador.
 */
import { z } from 'zod'

/* ------------------------------------------------------------------ */
/* Pele                                                                */
/* ------------------------------------------------------------------ */

export const TIPOS_PELE = ['oleosa', 'mista', 'seca', 'normal'] as const
export type TipoPele = (typeof TIPOS_PELE)[number]

export const ROTULO_TIPO_PELE: Record<TipoPele, string> = {
  oleosa: 'Oleosa',
  mista: 'Mista',
  seca: 'Seca',
  normal: 'Normal',
}

/** As oito características que a IA mede. Nota alta = aparece mais. */
export const CHAVES_MEDIDA = [
  'oleosidade',
  'ressecamento',
  'poros',
  'acne',
  'manchas',
  'vermelhidao',
  'linhas',
  'olheiras',
] as const
export type ChaveMedida = (typeof CHAVES_MEDIDA)[number]

export const ROTULO_MEDIDA: Record<ChaveMedida, string> = {
  oleosidade: 'Oleosidade',
  ressecamento: 'Ressecamento',
  poros: 'Poros aparentes',
  acne: 'Acne e cravos',
  manchas: 'Manchas',
  vermelhidao: 'Vermelhidão',
  linhas: 'Linhas finas',
  olheiras: 'Olheiras',
}

export const NIVEIS = ['minimo', 'leve', 'moderado', 'alto', 'intenso'] as const
export type Nivel = (typeof NIVEIS)[number]

export const ROTULO_NIVEL: Record<Nivel, string> = {
  minimo: 'mínimo',
  leve: 'leve',
  moderado: 'moderado',
  alto: 'alto',
  intenso: 'intenso',
}

/** Mesma escala que a IA recebe no prompt (lib/ia/prompt.ts). */
export function nivelDaNota(nota: number): Nivel {
  if (nota >= 80) return 'intenso'
  if (nota >= 60) return 'alto'
  if (nota >= 40) return 'moderado'
  if (nota >= 20) return 'leve'
  return 'minimo'
}

export type Confianca = 'baixa' | 'media' | 'alta'

export const ROTULO_CONFIANCA: Record<Confianca, string> = {
  baixa: 'confiança baixa',
  media: 'confiança média',
  alta: 'confiança alta',
}

export type Medida = {
  chave: ChaveMedida
  /** 0 a 100 */
  nota: number
  nivel: Nivel
  confianca: Confianca
  observacao: string
}

/* ------------------------------------------------------------------ */
/* Questionário                                                        */
/* ------------------------------------------------------------------ */

export const RespostasSchema = z.object({
  tipoPercebido: z.enum(['oleosa', 'mista', 'seca', 'normal', 'nao_sei']),
  incomodos: z.array(z.enum(CHAVES_MEDIDA)).max(CHAVES_MEDIDA.length),
  sensivel: z.enum(['sim', 'nao', 'nao_sei']),
  gestante: z.enum(['sim', 'nao', 'prefiro_nao_dizer']),
  faixaEtaria: z.enum(['menos_18', '18_24', '25_34', '35_44', '45_mais']),
  orcamento: z.enum(['ate_50', 'ate_80', 'ate_120', 'sem_limite']),
})
export type Respostas = z.infer<typeof RespostasSchema>

type Opcao<V extends string> = { valor: V; rotulo: string; detalhe?: string }

export const OPCOES_TIPO_PERCEBIDO: Opcao<Respostas['tipoPercebido']>[] = [
  { valor: 'oleosa', rotulo: 'Oleosa', detalhe: 'brilho no rosto todo' },
  { valor: 'mista', rotulo: 'Mista', detalhe: 'brilho na testa e no nariz' },
  { valor: 'seca', rotulo: 'Seca', detalhe: 'repuxa ou descama' },
  { valor: 'normal', rotulo: 'Normal', detalhe: 'sem incômodo' },
  { valor: 'nao_sei', rotulo: 'Não sei', detalhe: 'a análise descobre' },
]

/** Os incômodos usam as mesmas chaves das medidas. */
export const OPCOES_INCOMODOS: Opcao<ChaveMedida>[] = CHAVES_MEDIDA.map((chave) => ({
  valor: chave,
  rotulo: ROTULO_MEDIDA[chave],
}))

export const OPCOES_SENSIVEL: Opcao<Respostas['sensivel']>[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'nao', rotulo: 'Não' },
  { valor: 'nao_sei', rotulo: 'Não sei' },
]

export const OPCOES_GESTANTE: Opcao<Respostas['gestante']>[] = [
  { valor: 'nao', rotulo: 'Não' },
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'prefiro_nao_dizer', rotulo: 'Prefiro não dizer' },
]

export const OPCOES_FAIXA_ETARIA: Opcao<Respostas['faixaEtaria']>[] = [
  { valor: 'menos_18', rotulo: 'Menos de 18' },
  { valor: '18_24', rotulo: '18 a 24' },
  { valor: '25_34', rotulo: '25 a 34' },
  { valor: '35_44', rotulo: '35 a 44' },
  { valor: '45_mais', rotulo: '45 ou mais' },
]

export const OPCOES_ORCAMENTO: (Opcao<Respostas['orcamento']> & { limiteCentavos: number | null })[] = [
  { valor: 'ate_50', rotulo: 'Até R$ 50', limiteCentavos: 5000 },
  { valor: 'ate_80', rotulo: 'Até R$ 80', limiteCentavos: 8000 },
  { valor: 'ate_120', rotulo: 'Até R$ 120', limiteCentavos: 12000 },
  { valor: 'sem_limite', rotulo: 'Sem limite', limiteCentavos: null },
]

export function rotuloDe<V extends string>(opcoes: Opcao<V>[], valor: V): string {
  return opcoes.find((o) => o.valor === valor)?.rotulo ?? valor
}

/* ------------------------------------------------------------------ */
/* Produtos                                                            */
/* ------------------------------------------------------------------ */

/** Na ordem em que entram na rotina. */
export const CATEGORIAS = [
  'limpeza',
  'tonico',
  'esfoliante',
  'serum',
  'tratamento',
  'area_dos_olhos',
  'hidratante',
  'protetor',
  'mascara',
] as const
export type Categoria = (typeof CATEGORIAS)[number]

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  limpeza: 'Limpeza',
  tonico: 'Tônico',
  esfoliante: 'Esfoliante',
  serum: 'Sérum',
  tratamento: 'Tratamento',
  area_dos_olhos: 'Área dos olhos',
  hidratante: 'Hidratante',
  protetor: 'Protetor solar',
  mascara: 'Máscara',
}

export const TURNOS = ['manha', 'noite', 'ambos'] as const
export type Turno = (typeof TURNOS)[number]

export const ROTULO_TURNO: Record<Turno, string> = {
  manha: 'Manhã',
  noite: 'Noite',
  ambos: 'Manhã e noite',
}

export type ProdutoVitrine = {
  id: string
  codigo: string
  nome: string
  marca: string
  categoria: Categoria
  descricao: string
  ativos: string[]
  tiposPele: TipoPele[]
  indicacoes: ChaveMedida[]
  turno: Turno
  modoDeUso: string
  /** Foto do produto no Vercel Blob; null = a tela desenha a embalagem pela categoria. */
  imagemUrl: string | null
  precoCentavos: number
  estoque: number
  corredor: string
  evitarGestante: boolean
  evitarSensivel: boolean
  apenasAdulto: boolean
  ativo: boolean
}

/** Só aceitamos foto guardada no nosso Blob (vem de POST /api/produtos/imagem). */
const URL_DO_BLOB = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//

/** Corpo aceito em POST /api/produtos e PATCH /api/produtos/[id]. */
export const ProdutoEntradaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,20}$/, 'Use letras, números e hífen (ex.: SD-HID-05).'),
  nome: z.string().trim().min(3).max(120),
  marca: z.string().trim().min(2).max(60),
  categoria: z.enum(CATEGORIAS),
  descricao: z.string().trim().min(10).max(400),
  ativos: z.array(z.string().trim().min(2).max(60)).max(8),
  tiposPele: z.array(z.enum(TIPOS_PELE)).min(1),
  indicacoes: z.array(z.enum(CHAVES_MEDIDA)).min(1),
  turno: z.enum(TURNOS),
  modoDeUso: z.string().trim().min(5).max(300),
  imagemUrl: z.string().regex(URL_DO_BLOB, 'Envie a foto pelo botão de imagem.').nullable().optional(),
  precoCentavos: z.number().int().min(100).max(10_000_00),
  estoque: z.number().int().min(0).max(100_000),
  corredor: z.string().trim().min(1).max(40),
  evitarGestante: z.boolean(),
  evitarSensivel: z.boolean(),
  apenasAdulto: z.boolean(),
  ativo: z.boolean(),
})
export type ProdutoEntrada = z.infer<typeof ProdutoEntradaSchema>

/* ------------------------------------------------------------------ */
/* Análises                                                            */
/* ------------------------------------------------------------------ */

export type StatusAnalise = 'concluida' | 'foto_recusada' | 'erro'

export type ItemRotina = {
  produto: ProdutoVitrine
  turno: Turno
  ordem: number
  /** Por que a IA (ou a regra de segurança) indicou este produto. */
  motivo: string
}

export type AnaliseCompleta = {
  id: string
  /** ISO 8601 */
  criadoEm: string
  status: StatusAnalise
  respostas: Respostas
  tipoPele: TipoPele | null
  resumo: string | null
  /** Sempre na ordem de CHAVES_MEDIDA. */
  medidas: Medida[]
  pontosDeAtencao: string[]
  sugerirDermatologista: boolean
  motivoRecusa: string | null
  orientacaoFoto: string | null
  /** Produtos de "ambos" aparecem nas duas listas. */
  rotina: { manha: ItemRotina[]; noite: ItemRotina[] }
  /** Lista única de produtos indicados, na ordem da rotina. */
  produtos: ItemRotina[]
  totalCentavos: number
  avaliacao: 1 | -1 | null
  comentarioAvaliacao: string | null
  /** Só quem fez a análise avalia (e só a concluída). A loja conferindo pelo painel não. */
  podeAvaliar: boolean
  /** Preenchido quando a loja abre a análise de outra pessoa. */
  cliente: { nome: string } | null
}

export type AnaliseResumo = {
  id: string
  criadoEm: string
  status: StatusAnalise
  tipoPele: TipoPele | null
  /** A característica de nota mais alta, já com rótulo (ex.: "Oleosidade alta"). */
  destaque: string | null
  totalProdutos: number
  /** Só para a loja: quem fez. */
  cliente?: { nome: string; email: string }
}

/** Resposta de POST /api/analises. */
export type RespostaCriarAnalise =
  | { ok: true; id: string; status: 'concluida' }
  | { ok: true; id: string; status: 'foto_recusada'; motivo: string; orientacao: string }
  | { ok: false; erro: string }

export type MetricasLoja = {
  analisesHoje: number
  analises7Dias: number
  analisesTotal: number
  fotosRecusadas: number
  /** Distribuição de tipo de pele nas análises concluídas. */
  tiposPele: { tipo: TipoPele; total: number }[]
  /** Média de cada medida nas análises concluídas (0 a 100). */
  mediasMedidas: { chave: ChaveMedida; media: number }[]
  produtosMaisIndicados: { produto: ProdutoVitrine; vezes: number }[]
  /** Retorno das pessoas sobre a análise. */
  avaliacoes: { acertou: number; errou: number }
  /** Análises por dia nos últimos 14 dias (data YYYY-MM-DD). */
  porDia: { data: string; total: number }[]
  /** Custo estimado em dólar das chamadas de IA no total. */
  custoIaDolares: number
  ultimas: AnaliseResumo[]
}

/* ------------------------------------------------------------------ */
/* Sessão                                                              */
/* ------------------------------------------------------------------ */

export type Papel = 'cliente' | 'loja'

export type SessaoPublica = {
  id: string
  nome: string
  email: string
  papel: Papel
}

/** Corpo de resposta padrão das rotas de autenticação e de produtos. */
export type RespostaSimples = { ok: true; destino?: string } | { ok: false; erro: string }
