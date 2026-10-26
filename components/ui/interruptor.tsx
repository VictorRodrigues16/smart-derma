'use client'

import { cn } from './cn'

type Props = {
  ligado: boolean
  aoAlternar: () => void
  /** Nome acessível: o que o interruptor liga. */
  rotulo: string
  disabled?: boolean
  className?: string
}

/** Interruptor de liga e desliga. A área de toque passa de 44 px sem o desenho crescer. */
export function Interruptor({ ligado, aoAlternar, rotulo, disabled, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={disabled}
      onClick={aoAlternar}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200 before:absolute before:-inset-2 before:content-[''] disabled:opacity-50",
        ligado ? 'border-petroleo bg-petroleo' : 'border-tinta-suave/35 bg-nevoa',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-[3px] size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(22_32_31/0.35)] transition-transform duration-200',
          ligado ? 'translate-x-[24px]' : 'translate-x-0',
        )}
      />
    </button>
  )
}
