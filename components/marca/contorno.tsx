import type { CSSProperties } from 'react'
import { cn } from '@/components/ui/cn'

/**
 * O contorno oval da Smart Derma: o guia de enquadramento do rosto. Aparece na
 * câmera, na análise em andamento, no login e nos estados vazios.
 *
 * O traço é feito de pontos (ou de traços curtos). O espaçamento sai do
 * perímetro da elipse, então o número de pontos é exato qualquer que seja o
 * tamanho do desenho, e a animação "marchar" gira o contorno devagar andando
 * exatamente um período por volta (sem depender de `pathLength`).
 */

// Elipse 240 x 320 dentro de uma caixa 300 x 400, com folga para a espessura do traço.
const CAMINHO = 'M 30 200 A 120 160 0 1 1 270 200 A 120 160 0 1 1 30 200'
// Perímetro dessa elipse, em unidades da caixa (aproximação de Ramanujan).
const PERIMETRO = 884.1

type Estilo = 'pontos' | 'tracos'

function padrao(passos: number, estilo: Estilo) {
  const periodo = PERIMETRO / passos
  const tracejado =
    estilo === 'pontos'
      ? `0.01 ${(periodo - 0.01).toFixed(3)}`
      : `${(periodo * 0.46).toFixed(3)} ${(periodo * 0.54).toFixed(3)}`
  return { periodo, tracejado }
}

type Props = {
  className?: string
  /** Quantos pontos (ou traços) dão a volta. */
  passos?: number
  estilo?: Estilo
  espessura?: number
  /** Gira devagar. Respeita o movimento reduzido. */
  animado?: boolean
}

export function ContornoOval({ className, passos = 48, estilo = 'pontos', espessura = 5.5, animado = false }: Props) {
  const { periodo, tracejado } = padrao(passos, estilo)
  return (
    <svg viewBox="0 0 300 400" className={className} aria-hidden focusable="false" fill="none">
      <path
        d={CAMINHO}
        stroke="currentColor"
        strokeWidth={espessura}
        strokeLinecap="round"
        strokeDasharray={tracejado}
        className={cn(animado && 'animate-marchar')}
        style={animado ? ({ '--periodo': `-${periodo.toFixed(3)}` } as CSSProperties) : undefined}
      />
    </svg>
  )
}

/**
 * Máscara da câmera: escurece tudo fora do oval e desenha o contorno. A caixa
 * tem a proporção 3:4 do quadro da câmera.
 */
export function MascaraOval({ className, solido = false }: { className?: string; solido?: boolean }) {
  const { periodo, tracejado } = padrao(56, 'tracos')
  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
      focusable="false"
      fill="none"
    >
      <path
        fillRule="evenodd"
        fill="#0B4642"
        fillOpacity="0.56"
        d="M0 0H300V400H0Z M 30 200 A 120 160 0 1 1 270 200 A 120 160 0 1 1 30 200 Z"
      />
      <path
        d={CAMINHO}
        stroke="#FFFFFF"
        strokeWidth={solido ? 3 : 4}
        strokeLinecap="round"
        strokeDasharray={solido ? undefined : tracejado}
        className={cn(!solido && 'animate-marchar')}
        style={solido ? undefined : ({ '--periodo': `-${periodo.toFixed(3)}`, animationDuration: '3.2s' } as CSSProperties)}
      />
    </svg>
  )
}
