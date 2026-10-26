import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Resultado } from '@/components/analise/resultado'
import { obterAnalise } from '@/lib/servidor/dados'
import { exigirSessao } from '@/lib/servidor/guarda'

export const metadata: Metadata = { title: 'Resultado da análise' }

export default async function PaginaResultado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessao = await exigirSessao()
  const analise = await obterAnalise(id, sessao)
  if (!analise) notFound()
  // A loja abrindo a análise de outra pessoa está conferindo pelo painel:
  // volta para o painel e não avalia. Análise feita no totem é da própria loja.
  const doPainel = sessao.papel === 'loja' && !analise.podeAvaliar && analise.cliente !== null
  return <Resultado analise={analise} doPainel={doPainel} />
}
