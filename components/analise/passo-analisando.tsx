'use client'

import { Check, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ContornoOval } from '@/components/marca/contorno'
import { Alerta } from '@/components/ui/alerta'
import { Botao, BotaoLink } from '@/components/ui/botao'
import { cn } from '@/components/ui/cn'

const ETAPAS = [
  'Observando a oleosidade',
  'Lendo a textura e os poros',
  'Procurando manchas e vermelhidão',
  'Avaliando a hidratação',
  'Montando a sua rotina',
]

// A análise leva de 10 a 40 segundos. Cada etapa fica alguns segundos na tela,
// sem prometer tempo: a última espera o resultado chegar.
const SEGUNDOS_POR_ETAPA = 5.5
const SEGUNDOS_PARA_AVISAR = 35

type Props = {
  /** A foto que está sendo analisada (só existe no navegador). */
  foto: Blob | null
  /** Mensagem pronta do servidor quando a análise falhou. */
  erro: string | null
  /** O resultado chegou: fecha as etapas antes de trocar de tela. */
  concluida: boolean
  aoTentarDeNovo: () => void
  aoVoltarParaFoto: () => void
}

export function PassoAnalisando({ foto, erro, concluida, aoTentarDeNovo, aoVoltarParaFoto }: Props) {
  const [urlFoto, setUrlFoto] = useState<string | null>(null)
  const [etapa, setEtapa] = useState(0)
  const [demorou, setDemorou] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!foto) return
    const url = URL.createObjectURL(foto)
    setUrlFoto(url)
    return () => URL.revokeObjectURL(url)
  }, [foto])

  // Troca de etapa de tempos em tempos enquanto não há resultado nem erro.
  // Numa nova tentativa, recomeça da primeira.
  useEffect(() => {
    if (erro || concluida) return
    setEtapa(0)
    const id = window.setInterval(() => setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1)), SEGUNDOS_POR_ETAPA * 1000)
    return () => window.clearInterval(id)
  }, [erro, concluida])

  useEffect(() => {
    if (erro || concluida) return
    setDemorou(false)
    const id = window.setTimeout(() => setDemorou(true), SEGUNDOS_PARA_AVISAR * 1000)
    return () => window.clearTimeout(id)
  }, [erro, concluida])

  // Novo estado, novo foco: o leitor de tela lê o título (andamento ou erro).
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true })
  }, [erro, concluida])

  if (erro) {
    return (
      <div className="flex flex-1 flex-col px-5 pt-6 pb-8">
        <h1 ref={titulo} tabIndex={-1} className="text-[28px] leading-[1.08] font-bold outline-hidden">
          Não conseguimos concluir a análise
        </h1>
        <Alerta variante="erro" className="mt-5">
          {erro}
        </Alerta>
        <p className="mt-4 text-[16px] leading-snug text-tinta-suave">
          Suas respostas e a foto continuam aqui. Você pode tentar de novo agora.
        </p>
        <div className="mt-auto grid gap-2.5 pt-8">
          <Botao tamanho="lg" cheio onClick={aoTentarDeNovo}>
            Tentar de novo
          </Botao>
          <Botao variante="secundario" cheio onClick={aoVoltarParaFoto}>
            Escolher outra foto
          </Botao>
          <BotaoLink href="/app" variante="fantasma" cheio>
            Voltar ao início
          </BotaoLink>
        </div>
      </div>
    )
  }

  const etapaAtual = concluida ? ETAPAS.length : etapa

  return (
    <div className="flex flex-1 flex-col items-center px-5 pt-6 pb-10">
      <div className="relative aspect-[3/4] w-[min(70vw,290px)]">
        <ContornoOval className="absolute inset-0 size-full text-petroleo" passos={52} espessura={6} animado />
        <div className="absolute inset-[10%] overflow-hidden rounded-[50%] bg-petroleo-escuro">
          {urlFoto ? (
            // Foto local (blob), só para a pessoa acompanhar. Não vai para o otimizador de imagens.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={urlFoto} alt="" className="size-full object-cover opacity-90 saturate-[0.85]" />
          ) : null}
          <div className="absolute inset-0 bg-petroleo/25" />
          <div
            className="absolute inset-x-0 top-0 h-[28%] animate-escanear"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgb(255 255 255 / 0.55) 55%, transparent)',
            }}
          />
        </div>
      </div>

      <h1
        ref={titulo}
        tabIndex={-1}
        className="mt-9 text-center text-[30px] leading-[1.08] font-bold outline-hidden"
      >
        {concluida ? 'Sua análise está pronta' : 'Analisando a sua pele'}
      </h1>
      <p className="mt-2 text-center text-[16px] leading-snug text-tinta-suave">
        {concluida ? 'Abrindo o resultado.' : 'Isso pode levar alguns segundos. Não feche esta tela.'}
      </p>

      <ol className="mt-7 grid w-full max-w-[340px] gap-3.5" aria-label="Etapas da análise">
        {ETAPAS.map((texto, i) => {
          const feita = i < etapaAtual
          const atual = i === etapaAtual
          return (
            <li key={texto} className="flex items-center gap-3.5" aria-current={atual ? 'step' : undefined}>
              <span
                aria-hidden
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border-2 transition duration-500',
                  feita && 'border-petroleo bg-petroleo text-white',
                  atual && 'border-petroleo text-petroleo',
                  !feita && !atual && 'border-linha text-transparent',
                )}
              >
                {feita ? (
                  <Check className="size-4" strokeWidth={3.2} />
                ) : atual ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
              </span>
              <span
                className={cn(
                  'text-[17px] leading-tight transition-colors duration-500',
                  atual ? 'font-semibold text-tinta' : 'text-tinta-suave',
                )}
              >
                {texto}
              </span>
            </li>
          )
        })}
      </ol>

      {demorou && !concluida ? (
        <Alerta variante="info" className="mt-8 w-full max-w-[340px]">
          Está levando um pouco mais que o normal. Continue nesta tela: o resultado aparece assim que ficar pronto.
        </Alerta>
      ) : null}
    </div>
  )
}
