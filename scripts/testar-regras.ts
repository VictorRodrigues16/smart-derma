/**
 * Confere as regras de segurança da rotina (lib/ia/rotina.ts) contra o
 * catálogo do banco, sem chamar a IA e sem custo. Simula respostas da IA
 * com erros de propósito e confere que o código corrige cada um.
 *
 *   pnpm regras:testar
 */
import './ambiente'
import assert from 'node:assert/strict'
import { prisma } from '../lib/prisma'
import { paraVitrine } from '../lib/vitrine'
import { filtrarElegiveis, montarRotina } from '../lib/ia/rotina'
import { nivelDaNota, CHAVES_MEDIDA, type Medida, type Respostas } from '../lib/tipos'

const medidas = (notas: Partial<Record<(typeof CHAVES_MEDIDA)[number], number>>): Medida[] =>
  CHAVES_MEDIDA.map((chave) => ({ chave, nota: notas[chave] ?? 10, nivel: nivelDaNota(notas[chave] ?? 10), confianca: 'alta', observacao: '' }))
const base: Respostas = { tipoPercebido: 'mista', incomodos: ['acne'], sensivel: 'nao', gestante: 'nao', faixaEtaria: '25_34', orcamento: 'sem_limite' }

async function main() {
  const catalogo = (await prisma.produto.findMany({ where: { ativo: true } })).map(paraVitrine)
  let ok = 0
  const caso = (nome: string, fn: () => void) => { fn(); ok++; console.log('ok  ', nome) }

  caso('sem estoque nunca é elegível (SD-ESF-02)', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, base)
    assert(!elegiveis.some((p) => p.codigo === 'SD-ESF-02'))
  })
  caso('orçamento até R$ 50 tira todo protetor e avisa', () => {
    const r = { ...base, orcamento: 'ate_50' as const }
    const { elegiveis } = filtrarElegiveis(catalogo, r)
    assert(elegiveis.every((p) => p.precoCentavos <= 5000))
    const { itens, avisos } = montarRotina([], elegiveis, 'mista', medidas({}), r)
    assert(!itens.some((i) => i.produto.categoria === 'protetor'))
    assert(avisos.some((a) => a.includes('protetor')))
  })
  caso('gestante: sem retinol, tranexâmico nem secativo', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, { ...base, gestante: 'sim' })
    for (const c of ['SD-SER-04', 'SD-SER-06', 'SD-TRA-01']) assert(!elegiveis.some((p) => p.codigo === c), c)
  })
  caso('pele sensível: sem ácidos fortes nem vitamina C', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, { ...base, sensivel: 'sim' })
    for (const c of ['SD-SER-02', 'SD-SER-04', 'SD-ESF-01', 'SD-LIM-04', 'SD-TRA-03']) assert(!elegiveis.some((p) => p.codigo === c), c)
  })
  caso('menor de 18: sem retinol e esfoliantes', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, { ...base, faixaEtaria: 'menos_18' })
    for (const c of ['SD-SER-04', 'SD-ESF-01']) assert(!elegiveis.some((p) => p.codigo === c), c)
  })
  caso('código inventado e repetido caem; base é completada', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, base)
    const { itens } = montarRotina(
      [{ codigo: 'SD-XXX-99', turno: 'ambos', motivo: 'x' }, { codigo: 'SD-SER-01', turno: 'ambos', motivo: 'a' }, { codigo: 'sd-ser-01', turno: 'ambos', motivo: 'b' }],
      elegiveis, 'mista', medidas({ oleosidade: 70 }), base)
    const codigos = itens.map((i) => i.produto.codigo)
    assert(!codigos.includes('SD-XXX-99'))
    assert.equal(codigos.filter((c) => c === 'SD-SER-01').length, 1)
    for (const cat of ['limpeza', 'hidratante', 'protetor']) assert(itens.some((i) => i.produto.categoria === cat), cat)
  })
  caso('protetor sempre de manhã; produto de noite não vai para manhã', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, base)
    const { itens } = montarRotina(
      [{ codigo: 'SD-PRO-01', turno: 'noite', motivo: 'p' }, { codigo: 'SD-SER-04', turno: 'manha', motivo: 'r' }],
      elegiveis, 'mista', medidas({}), base)
    assert.equal(itens.find((i) => i.produto.codigo === 'SD-PRO-01')?.turno, 'manha')
    assert.equal(itens.find((i) => i.produto.codigo === 'SD-SER-04')?.turno, 'noite')
  })
  caso('retinol e esfoliante na mesma noite: sai o esfoliante', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, base)
    const { itens } = montarRotina(
      [{ codigo: 'SD-SER-04', turno: 'noite', motivo: 'r' }, { codigo: 'SD-ESF-01', turno: 'noite', motivo: 'e' }],
      elegiveis, 'mista', medidas({}), base)
    assert(itens.some((i) => i.produto.codigo === 'SD-SER-04'))
    assert(!itens.some((i) => i.produto.codigo === 'SD-ESF-01'))
  })
  caso('vermelhidão alta derruba produto marcado para pele sensível', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, base)
    const { itens } = montarRotina([{ codigo: 'SD-SER-02', turno: 'manha', motivo: 'c' }], elegiveis, 'mista', medidas({ vermelhidao: 70 }), base)
    assert(!itens.some((i) => i.produto.codigo === 'SD-SER-02'))
  })
  caso('teto de 6 produtos, base preservada, ordem por categoria', () => {
    const { elegiveis } = filtrarElegiveis(catalogo, base)
    const pedidos = ['SD-TON-01', 'SD-SER-01', 'SD-TRA-02', 'SD-OLH-01', 'SD-MAS-01', 'SD-SER-03', 'SD-LIM-01', 'SD-HID-01', 'SD-PRO-01']
    const { itens } = montarRotina(pedidos.map((codigo) => ({ codigo, turno: 'ambos' as const, motivo: 'm' })), elegiveis, 'mista', medidas({}), base)
    assert(itens.length <= 6, `vieram ${itens.length}`)
    for (const cat of ['limpeza', 'hidratante', 'protetor']) assert(itens.some((i) => i.produto.categoria === cat), cat)
    assert.deepEqual(itens.map((i) => i.ordem), itens.map((_, k) => k + 1))
    assert.equal(itens[0].produto.categoria, 'limpeza')
  })
  console.log(`\n${ok} casos passaram`)
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
