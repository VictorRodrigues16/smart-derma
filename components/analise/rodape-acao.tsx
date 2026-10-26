import type { ReactNode } from 'react'
import { cn } from '@/components/ui/cn'

/**
 * Barra de ação colada no pé da tela: o botão principal fica sempre à vista, no
 * centro e na zona do polegar. É `sticky` (não `fixed`) para respeitar a coluna
 * de 480 px no computador.
 */
export function RodapeAcao({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('sticky bottom-0 z-20 mt-auto border-t border-linha bg-white px-5 pt-3.5 pb-seguro', className)}>
      <div className="grid gap-2.5">{children}</div>
    </div>
  )
}
