import type { Categoria, ChaveMedida, ProdutoEntrada, ProdutoVitrine, TipoPele, Turno } from '@/lib/tipos'

/**
 * Regras do formulário de produto. Espelham o `ProdutoEntradaSchema` (lib/tipos.ts),
 * mas com a mensagem em português e apontando o campo certo: o schema continua
 * sendo a palavra final no servidor.
 */

/** O que a pessoa vê e digita. Preço em centavos (a máscara cuida da vírgula) e estoque como texto. */
export type Valores = {
  codigo: string
  nome: string
  marca: string
  categoria: Categoria | ''
  descricao: string
  ativos: string[]
  tiposPele: TipoPele[]
  indicacoes: ChaveMedida[]
  turno: Turno
  modoDeUso: string
  imagemUrl: string | null
  precoCentavos: number | null
  estoque: string
  corredor: string
  evitarGestante: boolean
  evitarSensivel: boolean
  apenasAdulto: boolean
  ativo: boolean
}

export type Erros = Partial<Record<keyof Valores, string>>

export function valoresIniciais(p: ProdutoVitrine | null): Valores {
  if (!p) {
    return {
      codigo: '',
      nome: '',
      marca: '',
      categoria: '',
      descricao: '',
      ativos: [],
      tiposPele: [],
      indicacoes: [],
      turno: 'ambos',
      modoDeUso: '',
      imagemUrl: null,
      precoCentavos: null,
      estoque: '',
      corredor: '',
      evitarGestante: false,
      evitarSensivel: false,
      apenasAdulto: false,
      ativo: true,
    }
  }
  return {
    codigo: p.codigo,
    nome: p.nome,
    marca: p.marca,
    categoria: p.categoria,
    descricao: p.descricao,
    ativos: p.ativos,
    tiposPele: p.tiposPele,
    indicacoes: p.indicacoes,
    turno: p.turno,
    modoDeUso: p.modoDeUso,
    imagemUrl: p.imagemUrl,
    precoCentavos: p.precoCentavos,
    estoque: String(p.estoque),
    corredor: p.corredor,
    evitarGestante: p.evitarGestante,
    evitarSensivel: p.evitarSensivel,
    apenasAdulto: p.apenasAdulto,
    ativo: p.ativo,
  }
}

export function validar(v: Valores): Erros {
  const e: Erros = {}

  if (!/^[A-Z0-9-]{3,20}$/.test(v.codigo.trim().toUpperCase())) {
    e.codigo = 'Use de 3 a 20 letras, números ou hífen. Exemplo: SD-HID-05.'
  }

  const nome = v.nome.trim()
  if (nome.length < 3) e.nome = 'Escreva o nome do produto, com pelo menos 3 letras.'
  else if (nome.length > 120) e.nome = 'Use no máximo 120 caracteres.'

  const marca = v.marca.trim()
  if (marca.length < 2) e.marca = 'Escreva a marca.'
  else if (marca.length > 60) e.marca = 'Use no máximo 60 caracteres.'

  if (!v.categoria) e.categoria = 'Escolha a categoria.'

  const descricao = v.descricao.trim()
  if (descricao.length < 10) e.descricao = 'Descreva o produto em pelo menos 10 caracteres.'
  else if (descricao.length > 400) e.descricao = 'Use no máximo 400 caracteres.'

  if (v.ativos.length > 8) e.ativos = 'Use no máximo 8 ativos.'
  if (v.tiposPele.length === 0) e.tiposPele = 'Escolha pelo menos um tipo de pele.'
  if (v.indicacoes.length === 0) e.indicacoes = 'Escolha pelo menos uma característica.'

  const modo = v.modoDeUso.trim()
  if (modo.length < 5) e.modoDeUso = 'Explique como usar, em pelo menos 5 caracteres.'
  else if (modo.length > 300) e.modoDeUso = 'Use no máximo 300 caracteres.'

  if (v.precoCentavos === null) e.precoCentavos = 'Informe o preço.'
  else if (v.precoCentavos < 100 || v.precoCentavos > 1_000_000) {
    e.precoCentavos = 'Use um preço entre R$ 1,00 e R$ 10.000,00.'
  }

  if (v.estoque === '') e.estoque = 'Informe o estoque. Use 0 quando acabou.'
  else if (Number(v.estoque) > 100_000) e.estoque = 'O estoque vai até 100.000 unidades.'

  const corredor = v.corredor.trim()
  if (!corredor) e.corredor = 'Diga onde o produto fica na loja.'
  else if (corredor.length > 40) e.corredor = 'Use no máximo 40 caracteres.'

  return e
}

/** Só chamar depois de `validar` sem erros. */
export function montarEntrada(v: Valores): ProdutoEntrada {
  return {
    codigo: v.codigo.trim().toUpperCase(),
    nome: v.nome.trim(),
    marca: v.marca.trim(),
    categoria: v.categoria as Categoria,
    descricao: v.descricao.trim(),
    ativos: v.ativos,
    tiposPele: v.tiposPele,
    indicacoes: v.indicacoes,
    turno: v.turno,
    modoDeUso: v.modoDeUso.trim(),
    imagemUrl: v.imagemUrl,
    precoCentavos: v.precoCentavos ?? 0,
    estoque: Number(v.estoque),
    corredor: v.corredor.trim(),
    evitarGestante: v.evitarGestante,
    evitarSensivel: v.evitarSensivel,
    apenasAdulto: v.apenasAdulto,
    ativo: v.ativo,
  }
}

const comoConjunto = (lista: readonly string[]) => [...lista].sort().join('|')
const comoLista = (lista: readonly string[]) => lista.join('|')

/**
 * Edição manda só o que mudou: se outra pessoa (ou outro aparelho) mexeu em
 * outro campo desse produto enquanto esta tela estava aberta, o salvamento
 * daqui não desfaz o trabalho dela.
 */
export function apenasMudancas(antes: ProdutoVitrine, depois: ProdutoEntrada): Partial<ProdutoEntrada> {
  const m: Partial<ProdutoEntrada> = {}
  if (depois.codigo !== antes.codigo) m.codigo = depois.codigo
  if (depois.nome !== antes.nome) m.nome = depois.nome
  if (depois.marca !== antes.marca) m.marca = depois.marca
  if (depois.categoria !== antes.categoria) m.categoria = depois.categoria
  if (depois.descricao !== antes.descricao) m.descricao = depois.descricao
  if (comoLista(depois.ativos) !== comoLista(antes.ativos)) m.ativos = depois.ativos
  if (comoConjunto(depois.tiposPele) !== comoConjunto(antes.tiposPele)) m.tiposPele = depois.tiposPele
  if (comoConjunto(depois.indicacoes) !== comoConjunto(antes.indicacoes)) m.indicacoes = depois.indicacoes
  if (depois.turno !== antes.turno) m.turno = depois.turno
  if (depois.modoDeUso !== antes.modoDeUso) m.modoDeUso = depois.modoDeUso
  if ((depois.imagemUrl ?? null) !== (antes.imagemUrl ?? null)) m.imagemUrl = depois.imagemUrl ?? null
  if (depois.precoCentavos !== antes.precoCentavos) m.precoCentavos = depois.precoCentavos
  if (depois.estoque !== antes.estoque) m.estoque = depois.estoque
  if (depois.corredor !== antes.corredor) m.corredor = depois.corredor
  if (depois.evitarGestante !== antes.evitarGestante) m.evitarGestante = depois.evitarGestante
  if (depois.evitarSensivel !== antes.evitarSensivel) m.evitarSensivel = depois.evitarSensivel
  if (depois.apenasAdulto !== antes.apenasAdulto) m.apenasAdulto = depois.apenasAdulto
  if (depois.ativo !== antes.ativo) m.ativo = depois.ativo
  return m
}
