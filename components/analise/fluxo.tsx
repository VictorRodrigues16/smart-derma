'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BotaoIcone, LinkIcone } from '@/components/ui/botao-icone'
import { cn } from '@/components/ui/cn'
import { enviarAnalise } from '@/lib/cliente/api'
import { RespostasSchema, type Respostas } from '@/lib/tipos'
import { PassoAnalisando } from './passo-analisando'
import { PassoConsentimento } from './passo-consentimento'
import { PassoFoto } from './passo-foto'
import { PassoPergunta } from './passo-pergunta'
import { PERGUNTAS, type ChaveUnica } from './perguntas'
import { Progresso, textoDoPasso, type Etapa } from './progresso'

type Recusa = { motivo: string; orientacao: string }

/**
 * Fluxo da análise em quatro passos: perguntas, consentimento, foto e análise.
 * Todo o estado vive aqui: voltar nunca perde resposta, e uma foto recusada
 * devolve a pessoa ao passo da foto com as respostas intactas.
 */
export function FluxoAnalise() {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('perguntas')
  const [pergunta, setPergunta] = useState(0)
  // "O que incomoda" aceita nenhuma marcação: começa como lista vazia.
  const [respostas, setRespostas] = useState<Partial<Respostas>>({ incomodos: [] })
  const [aceite, setAceite] = useState(false)
  const [foto, setFoto] = useState<Blob | null>(null)
  const [recusa, setRecusa] = useState<Recusa | null>(null)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [concluida, setConcluida] = useState(false)

  // Direção da troca de tela: 1 avança, -1 volta.
  const direcao = useRef(1)
  // Uma análise custa dinheiro: nunca dispara duas vezes.
  const enviando = useRef(false)

  // Cada tela nova começa no topo.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [etapa, pergunta])

  function ir(proxima: Etapa, sentido: 1 | -1 = 1) {
    direcao.current = sentido
    setEtapa(proxima)
  }

  /* Perguntas ----------------------------------------------------- */

  function escolher(valor: string) {
    const atual = PERGUNTAS[pergunta]
    if (!atual) return
    if (atual.tipo === 'multipla') {
      const lista = respostas.incomodos ?? []
      const proxima = lista.includes(valor as (typeof lista)[number])
        ? lista.filter((v) => v !== valor)
        : [...lista, valor as (typeof lista)[number]]
      setRespostas((r) => ({ ...r, incomodos: proxima }))
    } else {
      setRespostas((r) => ({ ...r, [atual.chave]: valor }) as Partial<Respostas>)
    }
  }

  function valorAtual(): string | string[] | undefined {
    const atual = PERGUNTAS[pergunta]
    if (!atual) return undefined
    if (atual.tipo === 'multipla') return respostas.incomodos ?? []
    return respostas[atual.chave as ChaveUnica]
  }

  function continuarPerguntas() {
    direcao.current = 1
    if (pergunta < PERGUNTAS.length - 1) {
      setPergunta(pergunta + 1)
      return
    }
    setEtapa('consentimento')
  }

  /* Voltar -------------------------------------------------------- */

  function voltar() {
    direcao.current = -1
    if (etapa === 'perguntas') {
      if (pergunta > 0) setPergunta(pergunta - 1)
      return
    }
    if (etapa === 'consentimento') {
      setPergunta(PERGUNTAS.length - 1)
      setEtapa('perguntas')
      return
    }
    if (etapa === 'foto') {
      setRecusa(null)
      setEtapa('consentimento')
    }
  }

  /* Envio --------------------------------------------------------- */

  async function analisar(blob: Blob) {
    if (enviando.current) return
    const completas = RespostasSchema.safeParse(respostas)
    if (!completas.success) {
      // Faltou resposta (não deveria acontecer): volta para a pergunta que falta.
      const faltando = PERGUNTAS.findIndex((p) => p.tipo === 'unica' && respostas[p.chave] === undefined)
      setPergunta(Math.max(0, faltando))
      ir('perguntas', -1)
      return
    }

    enviando.current = true
    setFoto(blob)
    setRecusa(null)
    setErroEnvio(null)
    setConcluida(false)
    ir('analisando')

    const r = await enviarAnalise(blob, completas.data, aceite)
    enviando.current = false

    if (!r.ok) {
      setErroEnvio(r.erro)
      return
    }
    if (r.status === 'foto_recusada') {
      setFoto(null)
      setRecusa({ motivo: r.motivo, orientacao: r.orientacao })
      ir('foto', -1)
      return
    }
    setConcluida(true)
    window.setTimeout(() => router.replace(`/app/analise/${r.id}`), 900)
  }

  function tentarDeNovo() {
    if (foto) void analisar(foto)
  }

  function voltarParaFoto() {
    setFoto(null)
    setErroEnvio(null)
    ir('foto', -1)
  }

  /* Tela ---------------------------------------------------------- */

  const analisando = etapa === 'analisando'
  const chaveDaTela = etapa === 'perguntas' ? `pergunta-${pergunta}` : etapa
  const perguntaAtual = PERGUNTAS[pergunta]

  return (
    <div className="flex flex-1 flex-col">
      <header className="shrink-0 px-5 pt-3">
        <div className="-mx-2 flex items-center gap-2">
          {etapa === 'perguntas' && pergunta === 0 ? (
            <LinkIcone href="/app" rotulo="Voltar para o início">
              <ArrowLeft className="size-5" aria-hidden />
            </LinkIcone>
          ) : (
            <BotaoIcone rotulo="Voltar" onClick={voltar} className={cn(analisando && 'invisible')} disabled={analisando}>
              <ArrowLeft className="size-5" aria-hidden />
            </BotaoIcone>
          )}
          <Progresso etapa={etapa} pergunta={pergunta} totalPerguntas={PERGUNTAS.length} className="flex-1" />
          <LinkIcone
            href="/app"
            rotulo="Sair da análise"
            className={cn(analisando && 'invisible')}
            aria-hidden={analisando || undefined}
            tabIndex={analisando ? -1 : undefined}
          >
            <X className="size-5" aria-hidden />
          </LinkIcone>
        </div>
        <p className="mt-1 px-0.5 text-[14px] text-tinta-suave">
          {textoDoPasso(etapa, pergunta, PERGUNTAS.length)}
        </p>
      </header>

      <div className="relative flex flex-1 flex-col overflow-x-clip">
        <AnimatePresence mode="wait" initial={false} custom={direcao.current}>
          <motion.div
            key={chaveDaTela}
            custom={direcao.current}
            variants={{
              entrada: (d: number) => ({ opacity: 0, x: 28 * d }),
              visivel: { opacity: 1, x: 0 },
              saida: (d: number) => ({ opacity: 0, x: -28 * d }),
            }}
            initial="entrada"
            animate="visivel"
            exit="saida"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {etapa === 'perguntas' && perguntaAtual ? (
              <PassoPergunta
                pergunta={perguntaAtual}
                valor={valorAtual()}
                aoEscolher={escolher}
                aoContinuar={continuarPerguntas}
              />
            ) : null}
            {etapa === 'consentimento' ? (
              <PassoConsentimento
                aceite={aceite}
                aoAlterarAceite={() => setAceite((a) => !a)}
                aoContinuar={() => ir('foto')}
              />
            ) : null}
            {etapa === 'foto' ? <PassoFoto recusa={recusa} aoUsarFoto={(f) => void analisar(f)} /> : null}
            {etapa === 'analisando' ? (
              <PassoAnalisando
                foto={foto}
                erro={erroEnvio}
                concluida={concluida}
                aoTentarDeNovo={tentarDeNovo}
                aoVoltarParaFoto={voltarParaFoto}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
