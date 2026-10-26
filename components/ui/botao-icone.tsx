import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from './cn'

const CLASSES =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-tinta transition duration-200 hover:bg-menta hover:text-petroleo active:scale-95 disabled:opacity-45'

/** Botão quadrado de 44 px só com ícone. O rótulo vira o nome acessível. */
export function BotaoIcone({
  rotulo,
  className,
  children,
  type = 'button',
  ...resto
}: ComponentProps<'button'> & { rotulo: string }) {
  return (
    <button type={type} aria-label={rotulo} className={cn(CLASSES, className)} {...resto}>
      {children}
    </button>
  )
}

export function LinkIcone({
  rotulo,
  className,
  children,
  ...resto
}: Omit<ComponentProps<typeof Link>, 'className' | 'aria-label'> & { rotulo: string; className?: string }) {
  return (
    <Link aria-label={rotulo} className={cn(CLASSES, className)} {...resto}>
      {children}
    </Link>
  )
}
