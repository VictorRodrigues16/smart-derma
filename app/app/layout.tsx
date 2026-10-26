import type { ReactNode } from 'react'
import { TopoApp } from '@/components/cliente/topo-app'
import { exigirSessao } from '@/lib/servidor/guarda'

/**
 * Área do cliente e do totem. No celular ocupa a tela toda; no computador vira
 * uma coluna de 480 px no meio, com cara de aplicativo.
 */
export default async function LayoutApp({ children }: { children: ReactNode }) {
  const sessao = await exigirSessao()

  return (
    <div className="min-h-dvh bg-nevoa">
      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-white md:border-x md:border-linha">
        <TopoApp papel={sessao.papel} />
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
