import { LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from './cn'

type Variante = 'primario' | 'secundario' | 'suave' | 'fantasma' | 'claro'
type Tamanho = 'sm' | 'md' | 'lg'

type Aparencia = {
  variante?: Variante
  tamanho?: Tamanho
  /** Ocupa a largura toda. */
  cheio?: boolean
  icone?: ReactNode
  iconeFim?: ReactNode
}

const BASE =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-petroleo text-white hover:bg-petroleo-escuro',
  secundario: 'border border-petroleo/35 bg-white text-petroleo hover:border-petroleo hover:bg-menta',
  suave: 'bg-menta text-petroleo hover:bg-[#d5e9e5]',
  fantasma: 'text-petroleo hover:bg-menta',
  // Para fundo petróleo.
  claro: 'bg-white text-petroleo hover:bg-menta',
}

// Todos com 44 px ou mais de altura: alvo de toque.
const TAMANHOS: Record<Tamanho, string> = {
  sm: 'h-11 px-5 text-[15px]',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-[17px]',
}

export function classesBotao({
  variante = 'primario',
  tamanho = 'md',
  cheio = false,
  className,
}: Pick<Aparencia, 'variante' | 'tamanho' | 'cheio'> & { className?: string }) {
  return cn(BASE, VARIANTES[variante], TAMANHOS[tamanho], cheio && 'w-full', className)
}

type BotaoProps = ComponentProps<'button'> & Aparencia & { carregando?: boolean }

export function Botao({
  variante,
  tamanho,
  cheio,
  icone,
  iconeFim,
  carregando = false,
  className,
  children,
  disabled,
  type = 'button',
  ...resto
}: BotaoProps) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classesBotao({ variante, tamanho, cheio, className })}
      {...resto}
    >
      {carregando ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : icone}
      {children}
      {iconeFim}
    </button>
  )
}

type BotaoLinkProps = Omit<ComponentProps<typeof Link>, 'className'> & Aparencia & { className?: string }

export function BotaoLink({ variante, tamanho, cheio, icone, iconeFim, className, children, ...resto }: BotaoLinkProps) {
  return (
    <Link className={classesBotao({ variante, tamanho, cheio, className })} {...resto}>
      {icone}
      {children}
      {iconeFim}
    </Link>
  )
}
