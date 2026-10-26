import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from './cn'

type Variante = 'aviso' | 'erro' | 'info'

const ESTILO: Record<Variante, { caixa: string; icone: string; Icone: LucideIcon }> = {
  aviso: { caixa: 'border-pele/80 bg-rosado', icone: 'text-terracota-escuro', Icone: CircleAlert },
  erro: { caixa: 'border-terracota/50 bg-terracota-trilho', icone: 'text-terracota-escuro', Icone: TriangleAlert },
  info: { caixa: 'border-petroleo/15 bg-menta', icone: 'text-petroleo', Icone: Info },
}

type Props = {
  variante?: Variante
  titulo?: string
  children?: ReactNode
  className?: string
}

/** Aviso em tom calmo. Erro vira `role="alert"`; o resto, `role="status"`. */
export function Alerta({ variante = 'aviso', titulo, children, className }: Props) {
  const { caixa, icone, Icone } = ESTILO[variante]
  return (
    <div
      role={variante === 'erro' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-2xl border p-4 text-[15px] leading-relaxed text-tinta', caixa, className)}
    >
      <Icone className={cn('mt-0.5 size-5 shrink-0', icone)} aria-hidden />
      <div className="min-w-0 flex-1">
        {titulo ? <p className="font-semibold text-tinta">{titulo}</p> : null}
        {children ? <div className={cn(titulo && 'mt-0.5')}>{children}</div> : null}
      </div>
    </div>
  )
}
