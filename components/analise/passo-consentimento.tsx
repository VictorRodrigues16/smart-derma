'use client'

import { ClipboardList, ScanFace, ShieldCheck, Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Botao } from '@/components/ui/botao'
import { CaixaAceite } from '@/components/ui/caixa-aceite'
import { RodapeAcao } from './rodape-acao'

type Garantia = { Icone: LucideIcon; titulo: string; texto: string }

const GARANTIAS: Garantia[] = [
  {
    Icone: ScanFace,
    titulo: 'A foto serve só para esta análise',
    texto: 'Uma inteligência artificial olha a sua pele nela para montar o resultado. Nada além disso.',
  },
  {
    Icone: Trash2,
    titulo: 'Ela é apagada assim que o resultado sai',
    texto: 'A imagem do seu rosto não fica guardada.',
  },
  {
    Icone: ClipboardList,
    titulo: 'O que fica salvo é o resultado',
    texto: 'O tipo de pele, as notas de cada característica e os produtos indicados, ligados à sua conta.',
  },
  {
    Icone: ShieldCheck,
    titulo: 'Você pode apagar seus dados',
    texto: 'Quando quiser, como garante a LGPD.',
  },
]

type Props = {
  aceite: boolean
  aoAlterarAceite: () => void
  aoContinuar: () => void
}

export function PassoConsentimento({ aceite, aoAlterarAceite, aoContinuar }: Props) {
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-5 pt-4 pb-8">
        <h1 ref={titulo} tabIndex={-1} className="text-[30px] leading-[1.08] font-bold outline-hidden">
          Antes de tirar a foto
        </h1>
        <p className="mt-2.5 text-[16px] leading-snug text-tinta-suave">
          Seu rosto é um dado sensível. Veja como a foto será usada.
        </p>

        <ul className="mt-6 divide-y divide-linha">
          {GARANTIAS.map(({ Icone, titulo: t, texto }) => (
            <li key={t} className="flex gap-4 py-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-menta text-petroleo">
                <Icone className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[17px] leading-tight font-semibold">{t}</p>
                <p className="mt-1 text-[15px] leading-snug text-tinta-suave">{texto}</p>
              </div>
            </li>
          ))}
        </ul>

        <CaixaAceite marcada={aceite} aoAlternar={aoAlterarAceite} className="mt-4">
          Li e autorizo o uso da minha foto apenas para esta análise.
        </CaixaAceite>
      </div>

      <RodapeAcao>
        <Botao tamanho="lg" cheio disabled={!aceite} onClick={aoContinuar}>
          Continuar
        </Botao>
      </RodapeAcao>
    </div>
  )
}
