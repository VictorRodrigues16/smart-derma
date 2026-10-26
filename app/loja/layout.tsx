import type { ReactNode } from 'react'
import { CascaLoja } from '@/components/loja/casca-loja'
import { exigirLoja } from '@/lib/servidor/guarda'

/** Painel da farmácia parceira: só a conta da loja entra. */
export default async function LayoutLoja({ children }: { children: ReactNode }) {
  const sessao = await exigirLoja()
  return (
    <CascaLoja nome={sessao.nome} email={sessao.email}>
      {children}
    </CascaLoja>
  )
}
