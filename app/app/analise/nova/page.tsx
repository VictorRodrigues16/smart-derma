import type { Metadata } from 'next'
import { FluxoAnalise } from '@/components/analise/fluxo'
import { exigirSessao } from '@/lib/servidor/guarda'

export const metadata: Metadata = { title: 'Nova análise' }

export default async function PaginaNovaAnalise() {
  await exigirSessao()
  return <FluxoAnalise />
}
