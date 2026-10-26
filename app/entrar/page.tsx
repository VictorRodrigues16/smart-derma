import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FormularioEntrar } from '@/components/entrar/formulario-entrar'
import { PainelMarca } from '@/components/entrar/painel-marca'
import { destinoDoPapel, lerSessao } from '@/lib/servidor/sessao'

export const metadata: Metadata = { title: 'Entrar' }

export default async function PaginaEntrar() {
  const sessao = await lerSessao()
  if (sessao) redirect(destinoDoPapel(sessao.papel))

  // Lido aqui, no servidor: o navegador nunca vê a variável, só o resultado.
  const demo = process.env.DEMO_ATALHOS === '1'

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <PainelMarca />
      <main
        id="conteudo"
        className="relative -mt-7 rounded-t-[32px] bg-white px-5 pt-7 pb-12 lg:mt-0 lg:grid lg:min-h-dvh lg:place-items-center lg:rounded-none lg:px-14 lg:py-12"
      >
        <FormularioEntrar demo={demo} />
      </main>
    </div>
  )
}
