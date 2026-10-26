'use client'

import { Check } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from './cn'

type Tipo = 'radio' | 'caixa'

type OpcaoProps = {
  rotulo: string
  detalhe?: string
  marcada: boolean
  aoAlternar: () => void
  tipo: Tipo
  icone?: ReactNode
  className?: string
}

/**
 * Opção de resposta em linha cheia. Selecionada: fundo verde claro, borda
 * petróleo e o selo de marcado. Serve para uma escolha (radio) ou várias (caixa).
 */
export function Opcao({ rotulo, detalhe, marcada, aoAlternar, tipo, icone, className }: OpcaoProps) {
  return (
    <button
      type="button"
      role={tipo === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={marcada}
      onClick={aoAlternar}
      className={cn(
        'flex min-h-[60px] w-full items-center gap-4 rounded-[18px] border px-4 py-3 text-left transition duration-200 active:scale-[0.992]',
        marcada
          ? 'border-petroleo bg-menta shadow-[inset_0_0_0_1px_var(--color-petroleo)]'
          : 'border-linha bg-white hover:border-petroleo/45 hover:bg-nevoa/60',
        className,
      )}
    >
      {icone ? <span className="shrink-0 text-petroleo">{icone}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] leading-tight font-semibold text-tinta">{rotulo}</span>
        {detalhe ? <span className="mt-0.5 block text-[15px] leading-snug text-tinta-suave">{detalhe}</span> : null}
      </span>
      <span
        aria-hidden
        className={cn(
          'grid size-7 shrink-0 place-items-center border-2 transition duration-200',
          tipo === 'radio' ? 'rounded-full' : 'rounded-lg',
          marcada ? 'border-petroleo bg-petroleo text-white' : 'border-tinta-suave/40 bg-white',
        )}
      >
        <Check
          className={cn('size-4 transition duration-200', marcada ? 'scale-100 opacity-100' : 'scale-50 opacity-0')}
          strokeWidth={3.2}
        />
      </span>
    </button>
  )
}

type GrupoProps = {
  tipo: Tipo
  /** id do elemento que dá o nome ao grupo (normalmente o título da pergunta). */
  rotuloId: string
  className?: string
  children: ReactNode
}

/** Agrupa opções e deixa as setas moverem o foco entre elas. */
export function GrupoOpcoes({ tipo, rotuloId, className, children }: GrupoProps) {
  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const avanca = e.key === 'ArrowDown' || e.key === 'ArrowRight'
    const volta = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
    if (!avanca && !volta) return
    const itens = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
    const atual = itens.findIndex((b) => b === document.activeElement)
    if (atual < 0) return
    e.preventDefault()
    const proximo = (atual + (avanca ? 1 : -1) + itens.length) % itens.length
    itens[proximo]?.focus()
  }

  return (
    <div
      role={tipo === 'radio' ? 'radiogroup' : 'group'}
      aria-labelledby={rotuloId}
      onKeyDown={aoTeclar}
      className={className}
    >
      {children}
    </div>
  )
}

type ChipProps = {
  marcado: boolean
  aoAlternar: () => void
  children: ReactNode
  /** Para chips de filtro, que não precisam do selo de marcado. */
  semSelo?: boolean
  className?: string
}

/** Pílula selecionável de 44 px de altura. */
export function Chip({ marcado, aoAlternar, children, semSelo = false, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={marcado}
      onClick={aoAlternar}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-medium whitespace-nowrap transition duration-200 active:scale-[0.97]',
        marcado
          ? 'border-petroleo bg-menta text-petroleo shadow-[inset_0_0_0_0.5px_var(--color-petroleo)]'
          : 'border-linha bg-white text-tinta hover:border-petroleo/45',
        className,
      )}
    >
      {marcado && !semSelo ? <Check className="-ml-0.5 size-4" strokeWidth={3} aria-hidden /> : null}
      {children}
    </button>
  )
}
