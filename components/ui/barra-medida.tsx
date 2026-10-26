'use client'

import type { CSSProperties } from 'react'
import { ROTULO_CONFIANCA, ROTULO_NIVEL, nivelDaNota, type Confianca, type Nivel } from '@/lib/tipos'
import { cn } from './cn'
import { useVisivel } from './use-visivel'

/**
 * Medidor de 0 a 100. O preenchimento cresce quando entra na tela e muda de
 * cor com o nível: petróleo (calmo) até 39, terracota clara no moderado e
 * terracota nos níveis alto e intenso. O trilho é um tom mais claro da mesma cor.
 * A cor nunca está sozinha: a nota e o nome do nível ficam escritos ao lado.
 */

const TOM: Record<Nivel, { preenchimento: string; trilho: string }> = {
  minimo: { preenchimento: 'bg-petroleo', trilho: 'bg-menta' },
  leve: { preenchimento: 'bg-petroleo', trilho: 'bg-menta' },
  moderado: { preenchimento: 'bg-terracota-claro', trilho: 'bg-terracota-trilho' },
  alto: { preenchimento: 'bg-terracota', trilho: 'bg-terracota-trilho' },
  intenso: { preenchimento: 'bg-terracota', trilho: 'bg-terracota-trilho' },
}

const BARRAS_CONFIANCA: Record<Confianca, number> = { baixa: 1, media: 2, alta: 3 }

function IndicadorConfianca({ confianca }: { confianca: Confianca }) {
  const cheias = BARRAS_CONFIANCA[confianca]
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-tinta-suave">
      <span aria-hidden className="inline-flex items-end gap-[2px]">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn('w-[3px] rounded-full', n <= cheias ? 'bg-tinta-suave' : 'bg-linha')}
            style={{ height: 4 + n * 3 }}
          />
        ))}
      </span>
      {ROTULO_CONFIANCA[confianca]}
    </span>
  )
}

type Props = {
  rotulo: string
  /** 0 a 100 */
  nota: number
  nivel?: Nivel
  observacao?: string
  confianca?: Confianca
  /** Atraso em ms, para as barras de uma lista crescerem em sequência. */
  atraso?: number
  className?: string
}

export function BarraMedida({ rotulo, nota, nivel, observacao, confianca, atraso = 0, className }: Props) {
  const [ref, visivel] = useVisivel<HTMLDivElement>()
  const valor = Math.max(0, Math.min(100, Math.round(nota)))
  const nivelFinal = nivel ?? nivelDaNota(valor)
  const tom = TOM[nivelFinal]

  return (
    <div ref={ref} className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[17px] font-semibold text-tinta">{rotulo}</p>
        <p className="shrink-0 text-[15px] text-tinta-suave">
          <span className="text-xl font-semibold text-tinta tabular-nums">{valor}</span>
          <span className="ml-1.5">{ROTULO_NIVEL[nivelFinal]}</span>
        </p>
      </div>
      <div
        role="meter"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-valuetext={`${valor} de 100, nível ${ROTULO_NIVEL[nivelFinal]}`}
        className={cn('mt-2 h-2.5 overflow-hidden rounded-full', tom.trilho)}
      >
        <div
          className={cn('medida-preenchimento h-full rounded-full', valor > 0 && 'min-w-1.5', tom.preenchimento)}
          data-visivel={visivel ? 'sim' : 'nao'}
          style={{ '--medida-largura': `${valor}%`, transitionDelay: `${atraso}ms` } as CSSProperties}
        />
      </div>
      {observacao || confianca ? (
        <div className="mt-2 flex items-start justify-between gap-4">
          <p className="min-w-0 flex-1 text-[15px] leading-snug text-tinta-suave">{observacao}</p>
          {confianca ? <IndicadorConfianca confianca={confianca} /> : null}
        </div>
      ) : null}
    </div>
  )
}
