import type { Metadata } from 'next'
import { Inicio } from '@/components/cliente/inicio'
import { listarAnalisesDoUsuario } from '@/lib/servidor/dados'
import { exigirSessao } from '@/lib/servidor/guarda'

export const metadata: Metadata = { title: 'Início' }

export default async function PaginaInicio() {
  const sessao = await exigirSessao()
  // No totem a conta é da loja e quem está na frente da tela é o próximo
  // cliente: o histórico de quem usou antes não aparece aqui, só no painel.
  const analises = sessao.papel === 'loja' ? [] : await listarAnalisesDoUsuario(sessao.id)
  return <Inicio sessao={sessao} analises={analises} />
}
