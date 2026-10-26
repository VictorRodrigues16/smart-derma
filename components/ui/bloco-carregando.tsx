import { cn } from './cn'

/** Retângulo cinza que pulsa devagar enquanto a página carrega. */
export function BlocoCarregando({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-2xl bg-nevoa', className)} />
}
