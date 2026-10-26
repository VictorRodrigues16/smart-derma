import { ContornoOval } from '@/components/marca/contorno'
import { BotaoLink } from '@/components/ui/botao'

/** Análise que não existe ou que pertence a outra conta: a tela não diferencia, de propósito. */
export default function AnaliseNaoEncontrada() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative h-[200px] w-[150px]">
        <ContornoOval className="absolute inset-0 size-full text-petroleo/50" passos={40} espessura={6} />
      </div>
      <h1 className="mt-8 text-[30px] leading-[1.08] font-bold">Não encontramos essa análise</h1>
      <p className="mt-3 max-w-[30ch] text-[17px] leading-relaxed text-tinta-suave">
        Ela não existe mais ou pertence a outra conta. Você pode fazer uma nova análise quando quiser.
      </p>
      <div className="mt-8 grid w-full max-w-[320px] gap-3">
        <BotaoLink href="/app/analise/nova" tamanho="lg" cheio>
          Fazer nova análise
        </BotaoLink>
        <BotaoLink href="/app" variante="secundario" cheio>
          Voltar ao início
        </BotaoLink>
      </div>
    </div>
  )
}
