import type { Metadata } from 'next'
import { PainelLoja } from '@/components/loja/painel'
import { metricasLoja } from '@/lib/servidor/dados'
import { exigirLoja } from '@/lib/servidor/guarda'

export const metadata: Metadata = { title: 'Painel da loja' }

export default async function PaginaPainel() {
  const sessao = await exigirLoja()
  const metricas = await metricasLoja()
  return <PainelLoja metricas={metricas} nomeDaLoja={sessao.nome} />
}
