'use client'

import { Moon, Sunrise } from 'lucide-react'
import { useState } from 'react'
import { Segmentado } from '@/components/ui/segmentado'
import type { ItemRotina } from '@/lib/tipos'
import { PassoDaRotina } from './passo-da-rotina'

type Turno = 'manha' | 'noite'

function ListaDePassos({ itens, vazio }: { itens: ItemRotina[]; vazio: string }) {
  if (itens.length === 0) {
    return <p className="rounded-2xl bg-nevoa p-5 text-[16px] text-tinta-suave">{vazio}</p>
  }
  return (
    <ol>
      {itens.map((item, i) => {
        const ultimo = i === itens.length - 1
        return (
          <li key={`${item.produto.id}-${item.turno}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-petroleo font-titulo text-[17px] font-bold text-white">
                {i + 1}
              </span>
              {!ultimo ? <span aria-hidden className="mt-2 w-px flex-1 bg-linha" /> : null}
            </div>
            <div className={ultimo ? 'flex min-w-0 flex-1' : 'flex min-w-0 flex-1 pb-7'}>
              <PassoDaRotina item={item} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Rotina em duas abas. As duas listas ficam na página; a que não está em uso fica escondida. */
export function RotinaAbas({ manha, noite }: { manha: ItemRotina[]; noite: ItemRotina[] }) {
  const [aba, setAba] = useState<Turno>('manha')

  return (
    <div className="mt-5">
      <Segmentado
        semantica="abas"
        idBase="rotina"
        rotuloAcessivel="Rotina de manhã ou de noite"
        valor={aba}
        aoMudar={setAba}
        itens={[
          { valor: 'manha', rotulo: 'Manhã', icone: <Sunrise className="size-5" aria-hidden />, contagem: manha.length },
          { valor: 'noite', rotulo: 'Noite', icone: <Moon className="size-5" aria-hidden />, contagem: noite.length },
        ]}
      />

      <div
        role="tabpanel"
        id="rotina-painel-manha"
        aria-labelledby="rotina-aba-manha"
        hidden={aba !== 'manha'}
        className="mt-7 animate-aparecer"
      >
        <ListaDePassos itens={manha} vazio="Nenhum produto indicado para a manhã." />
      </div>
      <div
        role="tabpanel"
        id="rotina-painel-noite"
        aria-labelledby="rotina-aba-noite"
        hidden={aba !== 'noite'}
        className="mt-7 animate-aparecer"
      >
        <ListaDePassos itens={noite} vazio="Nenhum produto indicado para a noite." />
      </div>
    </div>
  )
}
