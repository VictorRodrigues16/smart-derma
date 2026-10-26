import type { Metadata } from 'next'
import { ContornoOval } from '@/components/marca/contorno'
import { Simbolo } from '@/components/marca/simbolo'
import { BotaoLink } from '@/components/ui/botao'

export const metadata: Metadata = { title: 'Página não encontrada' }

export default function NaoEncontrada() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center bg-white px-6 py-16">
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center text-center">
        <div className="relative h-[220px] w-[165px]">
          <ContornoOval className="absolute inset-0 size-full text-petroleo/60" passos={44} espessura={6} animado />
          <Simbolo className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h1 className="mt-9 text-[36px] leading-[1.05] font-bold">Essa página não existe</h1>
        <p className="mt-3 max-w-[32ch] text-[17px] leading-relaxed text-tinta-suave">
          O endereço pode ter mudado ou ter sido digitado errado. Volte ao início para continuar.
        </p>
        <BotaoLink href="/" tamanho="lg" className="mt-9">
          Voltar ao início
        </BotaoLink>
      </div>
    </main>
  )
}
