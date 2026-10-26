import { cn } from '@/components/ui/cn'

export type Etapa = 'perguntas' | 'consentimento' | 'foto' | 'analisando'

export const ETAPAS: Etapa[] = ['perguntas', 'consentimento', 'foto', 'analisando']

const ROTULO_ETAPA: Record<Etapa, string> = {
  perguntas: 'Perguntas',
  consentimento: 'Consentimento',
  foto: 'Foto',
  analisando: 'Análise',
}

type Props = {
  etapa: Etapa
  /** Posição da pergunta (0 a total - 1), usada para encher o primeiro segmento aos poucos. */
  pergunta: number
  totalPerguntas: number
  className?: string
}

/** Quatro segmentos, um por passo. O primeiro enche conforme as perguntas são respondidas. */
export function Progresso({ etapa, pergunta, totalPerguntas, className }: Props) {
  const atual = ETAPAS.indexOf(etapa)
  const preenchimento = (i: number) => {
    if (i < atual) return 100
    if (i > atual) return 0
    if (etapa === 'perguntas') return ((pergunta + 1) / totalPerguntas) * 100
    if (etapa === 'analisando') return 100
    return 50
  }

  return (
    <div
      role="progressbar"
      aria-label="Progresso da análise"
      aria-valuemin={1}
      aria-valuemax={ETAPAS.length}
      aria-valuenow={atual + 1}
      aria-valuetext={`Passo ${atual + 1} de ${ETAPAS.length}: ${ROTULO_ETAPA[etapa]}`}
      className={cn('flex items-center gap-1.5', className)}
    >
      {ETAPAS.map((e, i) => (
        <div key={e} className="h-1.5 flex-1 overflow-hidden rounded-full bg-linha">
          <div
            className={cn(
              'h-full rounded-full bg-petroleo transition-[width] duration-500 ease-out',
              etapa === 'analisando' && i === atual && 'animate-respirar',
            )}
            style={{ width: `${preenchimento(i)}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export function textoDoPasso(etapa: Etapa, pergunta: number, totalPerguntas: number) {
  const base = `Passo ${ETAPAS.indexOf(etapa) + 1} de ${ETAPAS.length}`
  if (etapa === 'perguntas') return `${base}, pergunta ${pergunta + 1} de ${totalPerguntas}`
  return `${base}, ${ROTULO_ETAPA[etapa].toLowerCase()}`
}
