'use client'

import { motion } from 'framer-motion'
import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from './cn'

export type ItemSegmentado<V extends string> = {
  valor: V
  rotulo: string
  icone?: ReactNode
  contagem?: number
}

type Props<V extends string> = {
  itens: ItemSegmentado<V>[]
  valor: V
  aoMudar: (valor: V) => void
  rotuloAcessivel: string
  /** Abas trocam um painel; "radio" escolhe uma opção de formulário. */
  semantica?: 'abas' | 'radio'
  /** Necessário nas abas: liga cada aba ao seu painel (`${idBase}-painel-${valor}`). */
  idBase?: string
  className?: string
}

/**
 * Controle de 2 a 4 opções lado a lado, com a "pastilha" branca deslizando
 * para a opção ativa. Setas, Home e End trocam a opção.
 */
export function Segmentado<V extends string>({
  itens,
  valor,
  aoMudar,
  rotuloAcessivel,
  semantica = 'radio',
  idBase,
  className,
}: Props<V>) {
  const idPastilha = useId()
  const abas = semantica === 'abas'

  function aoTeclar(e: KeyboardEvent<HTMLDivElement>) {
    const teclas = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!teclas.includes(e.key)) return
    e.preventDefault()
    const atual = itens.findIndex((i) => i.valor === valor)
    let alvo = atual
    if (e.key === 'ArrowRight') alvo = (atual + 1) % itens.length
    if (e.key === 'ArrowLeft') alvo = (atual - 1 + itens.length) % itens.length
    if (e.key === 'Home') alvo = 0
    if (e.key === 'End') alvo = itens.length - 1
    const item = itens[alvo]
    if (!item) return
    aoMudar(item.valor)
    const botoes = e.currentTarget.querySelectorAll<HTMLButtonElement>('button[role]')
    botoes[alvo]?.focus()
  }

  return (
    <div
      role={abas ? 'tablist' : 'radiogroup'}
      aria-label={rotuloAcessivel}
      onKeyDown={aoTeclar}
      className={cn('grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-nevoa p-1', className)}
    >
      {itens.map((item) => {
        const ativo = item.valor === valor
        return (
          <button
            key={item.valor}
            type="button"
            role={abas ? 'tab' : 'radio'}
            aria-selected={abas ? ativo : undefined}
            aria-checked={abas ? undefined : ativo}
            aria-controls={abas && idBase ? `${idBase}-painel-${item.valor}` : undefined}
            id={abas && idBase ? `${idBase}-aba-${item.valor}` : undefined}
            tabIndex={ativo ? 0 : -1}
            onClick={() => aoMudar(item.valor)}
            className={cn(
              'relative z-10 inline-flex h-11 items-center justify-center gap-2 rounded-full px-3 text-[15px] font-semibold whitespace-nowrap transition-colors duration-200',
              ativo ? 'text-petroleo' : 'text-tinta-suave hover:text-tinta',
            )}
          >
            {ativo ? (
              <motion.span
                layoutId={idPastilha}
                className="absolute inset-0 -z-10 rounded-full bg-white shadow-suave"
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              />
            ) : null}
            {item.icone}
            {item.rotulo}
            {item.contagem !== undefined ? (
              <span
                className={cn(
                  'grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums',
                  ativo ? 'bg-menta text-petroleo' : 'bg-white/70 text-tinta-suave',
                )}
              >
                {item.contagem}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
