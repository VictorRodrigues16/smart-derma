import { ShieldCheck, Store, Wallet } from 'lucide-react'
import { ContornoOval } from '@/components/marca/contorno'
import { IlustracaoAnalise } from '@/components/marca/ilustracao-analise'
import { Marca } from '@/components/marca/simbolo'

const FATOS = [
  { Icone: ShieldCheck, texto: 'Sua foto é apagada assim que o resultado sai.' },
  { Icone: Store, texto: 'A rotina só leva produtos que a farmácia tem em estoque.' },
  { Icone: Wallet, texto: 'Cabe no valor que você escolher gastar em cada produto.' },
]

/**
 * Lado da marca na tela de entrada. No celular é uma faixa petróleo no topo
 * com a promessa; no computador vira a metade esquerda da tela, com a
 * ilustração do contorno e as garantias.
 */
export function PainelMarca() {
  return (
    <section className="relative isolate overflow-hidden bg-petroleo px-6 pt-7 pb-14 text-white lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:px-14 lg:py-12">
      {/* Contorno de enfeite que sangra para fora da faixa, só no celular. */}
      <ContornoOval
        className="pointer-events-none absolute -top-8 -right-24 -z-10 h-[360px] w-[270px] text-white/15 lg:hidden"
        passos={44}
        espessura={5}
      />

      <Marca invertida tamanho="md" />

      <div className="mt-8 lg:mt-0">
        <h1 className="text-[34px] leading-[1.04] font-bold tracking-[-0.03em] sm:text-[44px] lg:text-[64px]">
          Entenda sua pele.
          <br />
          Escolha melhor.
        </h1>
        <p className="mt-4 max-w-[36ch] text-[16px] leading-relaxed text-white/80 lg:mt-5 lg:max-w-[44ch] lg:text-[19px]">
          Responda algumas perguntas, tire uma foto e receba uma rotina de manhã e de noite só com produtos que a
          farmácia tem em estoque.
        </p>
      </div>

      <IlustracaoAnalise className="my-8 hidden lg:block" />

      <ul className="hidden gap-3.5 lg:grid">
        {FATOS.map(({ Icone, texto }) => (
          <li key={texto} className="flex items-center gap-3.5 text-[16px] text-white/85">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10">
              <Icone className="size-5 text-pele" aria-hidden />
            </span>
            {texto}
          </li>
        ))}
      </ul>
    </section>
  )
}
