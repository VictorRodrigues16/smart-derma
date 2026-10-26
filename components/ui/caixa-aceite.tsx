'use client'

import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Props = {
  marcada: boolean
  aoAlternar: () => void
  children: ReactNode
  className?: string
}

/** Caixa de aceite: a linha toda é o botão, o quadrado é só o sinal. */
export function CaixaAceite({ marcada, aoAlternar, children, className }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      onClick={aoAlternar}
      className={cn(
        'flex min-h-16 w-full items-start gap-4 rounded-[18px] border p-4 text-left transition duration-200',
        marcada
          ? 'border-petroleo bg-menta shadow-[inset_0_0_0_1px_var(--color-petroleo)]'
          : 'border-linha bg-white hover:border-petroleo/45',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2 transition duration-200',
          marcada ? 'border-petroleo bg-petroleo text-white' : 'border-tinta-suave/45 bg-white',
        )}
      >
        <Check
          className={cn('size-[18px] transition duration-200', marcada ? 'scale-100 opacity-100' : 'scale-50 opacity-0')}
          strokeWidth={3.2}
        />
      </span>
      <span className="min-w-0 flex-1 text-base leading-snug font-medium text-tinta">{children}</span>
    </button>
  )
}
