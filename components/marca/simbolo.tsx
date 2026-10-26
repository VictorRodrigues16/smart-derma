import { cn } from '@/components/ui/cn'

/**
 * Símbolo da Smart Derma: o contorno oval do rosto, desenhado em pontos como o
 * guia da câmera, com um S dentro. É a mesma forma do favicon (app/icon.svg).
 */

type Variante = 'petroleo' | 'pele'

const CORES: Record<Variante, { fundo: string; contorno: string; letra: string }> = {
  petroleo: { fundo: '#0E5A55', contorno: '#FFFFFF', letra: '#EFC7BD' },
  // Para usar sobre fundo petróleo.
  pele: { fundo: '#EFC7BD', contorno: '#0E5A55', letra: '#0E5A55' },
}

type SimboloProps = {
  className?: string
  variante?: Variante
  /** Texto para leitor de tela. Sem ele, o símbolo é decorativo. */
  titulo?: string
}

export function Simbolo({ className, variante = 'petroleo', titulo }: SimboloProps) {
  const c = CORES[variante]
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      <rect width="48" height="48" rx="14" fill={c.fundo} />
      <ellipse
        cx="24"
        cy="24"
        rx="12.5"
        ry="16.5"
        fill="none"
        stroke={c.contorno}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="0.1 6.44"
      />
      <path
        d="M29 19C29 15.6 19.2 15.6 19.2 20.4C19.2 25 29 23.4 29 28C29 32.6 19.2 32.4 19.2 29"
        fill="none"
        stroke={c.letra}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

type MarcaProps = {
  className?: string
  tamanho?: 'sm' | 'md' | 'lg'
  /** Texto claro e símbolo em pele, para fundo petróleo. */
  invertida?: boolean
}

const TAMANHOS = {
  sm: { simbolo: 'size-7', texto: 'text-[17px]' },
  md: { simbolo: 'size-9', texto: 'text-[20px]' },
  lg: { simbolo: 'size-12', texto: 'text-[28px]' },
} as const

/** Símbolo + nome. */
export function Marca({ className, tamanho = 'md', invertida = false }: MarcaProps) {
  const t = TAMANHOS[tamanho]
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Simbolo className={cn('shrink-0', t.simbolo)} variante={invertida ? 'pele' : 'petroleo'} />
      <span
        className={cn(
          'font-titulo leading-none font-bold tracking-[-0.03em]',
          t.texto,
          invertida ? 'text-white' : 'text-tinta',
        )}
      >
        Smart Derma
      </span>
    </span>
  )
}
