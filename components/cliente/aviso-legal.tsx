import { ShieldCheck } from 'lucide-react'
import { cn } from '@/components/ui/cn'

/** Texto exato exigido pelo contrato em todo resultado. */
export const TEXTO_AVISO_LEGAL =
  'A Smart Derma orienta a escolha de cosméticos e não substitui a consulta com um dermatologista.'

export function AvisoLegal({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start gap-2.5 text-[14px] leading-snug text-tinta-suave', className)}>
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-petroleo" aria-hidden />
      <span>{TEXTO_AVISO_LEGAL}</span>
    </p>
  )
}
