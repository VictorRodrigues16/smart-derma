import {
  CATEGORIAS,
  OPCOES_ORCAMENTO,
  ROTULO_CATEGORIA,
  type Categoria,
  type Medida,
  type ProdutoVitrine,
  type Respostas,
  type TipoPele,
  type Turno,
} from '@/lib/tipos'

/**
 * Segurança em código, não em prompt.
 *
 * O prompt pede para a IA respeitar gravidez, sensibilidade e combinações,
 * mas pedido não é garantia. Por isso:
 *  1. ANTES da IA: o catálogo é filtrado por estoque, orçamento, gravidez,
 *     sensibilidade e idade. A IA só recebe códigos que já podem ser
 *     indicados para aquela pessoa.
 *  2. DEPOIS da IA: a rotina é conferida de novo. Código fora da lista cai,
 *     turno incompatível é corrigido, categoria repetida no mesmo turno
 *     cai, retinol não fica junto de esfoliante, e a base (limpeza,
 *     hidratante e protetor) é completada se a IA esquecer.
 */

export type Elegibilidade = {
  elegiveis: ProdutoVitrine[]
  /** Avisos para a pessoa sobre o que ficou de fora e por quê. */
  avisos: string[]
}

export function filtrarElegiveis(catalogo: ProdutoVitrine[], respostas: Respostas): Elegibilidade {
  const limite = OPCOES_ORCAMENTO.find((o) => o.valor === respostas.orcamento)?.limiteCentavos ?? null
  const semGravidez = respostas.gestante === 'sim' || respostas.gestante === 'prefiro_nao_dizer'
  const semFortes = respostas.sensivel === 'sim'
  const menor = respostas.faixaEtaria === 'menos_18'

  const elegiveis = catalogo.filter(
    (p) =>
      p.ativo &&
      p.estoque > 0 &&
      (limite === null || p.precoCentavos <= limite) &&
      !(semGravidez && p.evitarGestante) &&
      !(semFortes && p.evitarSensivel) &&
      !(menor && p.apenasAdulto),
  )

  const avisos: string[] = []
  if (respostas.gestante === 'sim') {
    avisos.push(
      'Deixamos de fora ativos que não são indicados na gravidez e na amamentação. Confirme a rotina com seu médico.',
    )
  } else if (respostas.gestante === 'prefiro_nao_dizer') {
    avisos.push('Por segurança, deixamos de fora ativos que não são indicados na gravidez e na amamentação.')
  }
  if (semFortes) avisos.push('Como sua pele é sensível, deixamos de fora ácidos e ativos mais fortes.')
  if (menor) avisos.push('Para menores de 18 anos, a rotina fica no básico, sem ativos fortes.')

  return { elegiveis, avisos }
}

/* ------------------------------------------------------------------ */

export type EscolhaIA = { codigo: string; turno: Turno; motivo: string }
export type ItemFinal = { produto: ProdutoVitrine; turno: Turno; ordem: number; motivo: string }

const ORDEM_CATEGORIA = new Map<Categoria, number>(CATEGORIAS.map((c, i) => [c, i]))
const MAXIMO_PRODUTOS = 6
const RETINOIDE = /retin|adapaleno/i

function cobreManha(t: Turno) {
  return t === 'manha' || t === 'ambos'
}
function cobreNoite(t: Turno) {
  return t === 'noite' || t === 'ambos'
}
function sobrepoe(a: Turno, b: Turno) {
  return (cobreManha(a) && cobreManha(b)) || (cobreNoite(a) && cobreNoite(b))
}

/** O turno que vale: o do produto manda; "ambos" aceita a sugestão da IA. */
function turnoValido(produto: ProdutoVitrine, sugerido: Turno): Turno {
  if (produto.categoria === 'protetor') return 'manha'
  if (produto.turno === 'ambos') return sugerido
  return produto.turno
}

/** Pontuação para completar a base quando a IA não indicou. */
function pontuar(p: ProdutoVitrine, tipo: TipoPele, medidas: Medida[], respostas: Respostas) {
  let pontos = p.tiposPele.includes(tipo) ? 3 : 0
  for (const indicacao of p.indicacoes) {
    const nota = medidas.find((m) => m.chave === indicacao)?.nota ?? 0
    if (nota >= 40) pontos += 2
    if (respostas.incomodos.includes(indicacao)) pontos += 1
  }
  return pontos
}

const MOTIVO_BASE: Partial<Record<Categoria, string>> = {
  limpeza: 'Base da rotina: limpa a pele sem agredir, de manhã e à noite.',
  hidratante: 'Base da rotina: mantém a pele hidratada e protege a barreira natural.',
  protetor: 'Base da rotina: o protetor evita manchas e o envelhecimento causado pelo sol.',
}

export function montarRotina(
  escolhas: EscolhaIA[],
  elegiveis: ProdutoVitrine[],
  tipo: TipoPele,
  medidas: Medida[],
  respostas: Respostas,
): { itens: ItemFinal[]; avisos: string[] } {
  const porCodigo = new Map(elegiveis.map((p) => [p.codigo.toUpperCase(), p]))
  const vermelhidao = medidas.find((m) => m.chave === 'vermelhidao')?.nota ?? 0
  const evitarFortes = respostas.sensivel === 'sim' || vermelhidao >= 60
  const avisos: string[] = []

  const itens: Omit<ItemFinal, 'ordem'>[] = []
  const usados = new Set<string>()

  for (const escolha of escolhas) {
    const produto = porCodigo.get(escolha.codigo.trim().toUpperCase())
    if (!produto || usados.has(produto.id)) continue
    if (evitarFortes && produto.evitarSensivel) continue

    const turno = turnoValido(produto, escolha.turno)
    // Mesma categoria no mesmo turno é repetição (dois hidratantes de manhã).
    const repetido = itens.some((i) => i.produto.categoria === produto.categoria && sobrepoe(i.turno, turno))
    if (repetido) continue

    itens.push({ produto, turno, motivo: escolha.motivo.trim() || MOTIVO_BASE[produto.categoria] || '' })
    usados.add(produto.id)
  }

  // Retinol e esfoliante na mesma noite irritam: sai o esfoliante.
  const temRetinoideNoite = itens.some((i) => cobreNoite(i.turno) && i.produto.ativos.some((a) => RETINOIDE.test(a)))
  if (temRetinoideNoite) {
    for (let k = itens.length - 1; k >= 0; k--) {
      if (itens[k].produto.categoria === 'esfoliante' && cobreNoite(itens[k].turno)) itens.splice(k, 1)
    }
  }

  // Completa a base que faltou.
  for (const categoria of ['limpeza', 'hidratante', 'protetor'] as const) {
    if (itens.some((i) => i.produto.categoria === categoria)) continue
    const candidatos = elegiveis
      .filter((p) => p.categoria === categoria && !usados.has(p.id) && !(evitarFortes && p.evitarSensivel))
      .sort(
        (a, b) =>
          pontuar(b, tipo, medidas, respostas) - pontuar(a, tipo, medidas, respostas) ||
          a.precoCentavos - b.precoCentavos,
      )
    const melhor = candidatos[0]
    if (!melhor) {
      if (categoria === 'protetor') {
        avisos.push(
          'Nenhum protetor solar coube no orçamento ou está em estoque agora. Ele é o passo mais importante da rotina: peça uma indicação no balcão.',
        )
      }
      continue
    }
    itens.push({
      produto: melhor,
      turno: turnoValido(melhor, categoria === 'protetor' ? 'manha' : 'ambos'),
      motivo: MOTIVO_BASE[categoria] ?? `Base da rotina: ${ROTULO_CATEGORIA[categoria].toLowerCase()}.`,
    })
    usados.add(melhor.id)
  }

  // Teto de produtos: a base fica; corta o que a IA listou por último.
  const base = new Set<Categoria>(['limpeza', 'hidratante', 'protetor'])
  while (itens.length > MAXIMO_PRODUTOS) {
    let k = itens.length - 1
    while (k >= 0 && base.has(itens[k].produto.categoria)) k--
    if (k < 0) break
    itens.splice(k, 1)
  }

  const ordenados = itens
    .sort(
      (a, b) =>
        (ORDEM_CATEGORIA.get(a.produto.categoria) ?? 99) - (ORDEM_CATEGORIA.get(b.produto.categoria) ?? 99),
    )
    .map((item, i) => ({ ...item, ordem: i + 1 }))

  return { itens: ordenados, avisos }
}
