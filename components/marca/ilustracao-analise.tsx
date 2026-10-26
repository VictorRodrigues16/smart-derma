import { ROTULO_MEDIDA, type ChaveMedida } from '@/lib/tipos'
import { ContornoOval } from './contorno'

/**
 * Ilustração do login: o contorno do rosto com três "anotações" de medida,
 * como no resultado da análise. É só desenho (sem número, sem dado): as
 * barras têm tamanhos de enfeite.
 */

type Anotacao = {
  chave: ChaveMedida
  largura: number
  cor: string
  /** Posição do chip e do ponto de ligação, em % da caixa. */
  chip: string
  ponto: { x: number; y: number }
}

const ANOTACOES: Anotacao[] = [
  { chave: 'oleosidade', largura: 74, cor: 'bg-terracota', chip: 'right-[-6%] top-[13%]', ponto: { x: 75.7, y: 19.3 } },
  { chave: 'poros', largura: 42, cor: 'bg-pele', chip: 'left-[-10%] top-[41%]', ponto: { x: 10.7, y: 43 } },
  { chave: 'ressecamento', largura: 56, cor: 'bg-pele', chip: 'right-[-2%] bottom-[11%]', ponto: { x: 75.7, y: 80.6 } },
]

export function IlustracaoAnalise({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[330px]">
        <ContornoOval className="absolute inset-0 size-full text-white/75" passos={52} espessura={6.5} animado />
        <div className="absolute inset-[8.5%] rounded-[50%] bg-white/[0.06]" />
        {ANOTACOES.map((a) => (
          <span
            key={a.chave}
            className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pele ring-4 ring-petroleo"
            style={{ left: `${a.ponto.x}%`, top: `${a.ponto.y}%` }}
          />
        ))}
        {ANOTACOES.map((a) => (
          <div
            key={a.chave}
            className={`absolute w-[46%] rounded-2xl border border-white/20 bg-petroleo-escuro/85 px-3.5 py-3 text-white ${a.chip}`}
          >
            <p className="text-[13px] leading-none font-semibold">{ROTULO_MEDIDA[a.chave]}</p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className={`h-full rounded-full ${a.cor}`} style={{ width: `${a.largura}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
