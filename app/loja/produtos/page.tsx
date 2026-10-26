import type { Metadata } from 'next'
import { CatalogoProdutos } from '@/components/loja/catalogo-produtos'
import { listarProdutos } from '@/lib/servidor/dados'
import { exigirLoja } from '@/lib/servidor/guarda'

export const metadata: Metadata = { title: 'Produtos' }

export default async function PaginaProdutos() {
  await exigirLoja()
  const produtos = await listarProdutos({ incluirInativos: true })
  return <CatalogoProdutos produtos={produtos} />
}
