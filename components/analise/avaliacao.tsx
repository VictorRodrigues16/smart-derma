'use client'

import { Check, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useId, useState } from 'react'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { CampoTexto } from '@/components/ui/campo'
import { cn } from '@/components/ui/cn'
import { avaliarAnalise } from '@/lib/cliente/api'

type Nota = 1 | -1

type Props = {
  analiseId: string
  /** Avaliação que já está salva (null = ainda não avaliou). */
  avaliacao: Nota | null
  comentario: string | null
}

/** "A análise acertou?" Com "errou", abre um campo de comentário opcional. */
export function Avaliacao({ analiseId, avaliacao, comentario }: Props) {
  const idTitulo = useId()
  const [salva, setSalva] = useState<Nota | null>(avaliacao)
  const [escolha, setEscolha] = useState<Nota | null>(null)
  const [texto, setTexto] = useState(comentario ?? '')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Quem já avaliou vê o agradecimento; "Mudar resposta" volta para as duas opções.
  const [mudando, setMudando] = useState(false)

  const mostrandoAgradecimento = salva !== null && !mudando

  async function enviar(nota: Nota, comentarioFinal?: string) {
    if (enviando) return
    setEnviando(true)
    setErro(null)
    const r = await avaliarAnalise(analiseId, nota, comentarioFinal)
    setEnviando(false)
    if (!r.ok) {
      setErro(r.erro)
      return
    }
    setSalva(nota)
    setEscolha(null)
    setMudando(false)
  }

  function escolher(nota: Nota) {
    if (nota === 1) {
      void enviar(1)
    } else {
      setEscolha(-1)
      setErro(null)
    }
  }

  return (
    <section className="mx-5 mt-10 rounded-[24px] border border-linha p-6" aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className="text-[22px] leading-tight font-semibold">
        A análise acertou?
      </h2>

      {mostrandoAgradecimento ? (
        <div className="mt-4" role="status">
          <p className="flex items-center gap-2.5 text-[16px] font-semibold text-petroleo">
            <span className="grid size-7 place-items-center rounded-full bg-menta">
              <Check className="size-4" strokeWidth={3} aria-hidden />
            </span>
            Obrigado pelo retorno
          </p>
          <p className="mt-2 text-[15px] leading-snug text-tinta-suave">
            {salva === 1
              ? 'Você marcou que a análise acertou. Isso ajuda a Smart Derma a saber o que está funcionando.'
              : 'Você marcou que a análise errou. Isso ajuda a Smart Derma a melhorar.'}
          </p>
          <Botao
            variante="fantasma"
            tamanho="sm"
            className="-ml-5 mt-1"
            onClick={() => {
              setMudando(true)
              setEscolha(null)
            }}
          >
            Mudar minha resposta
          </Botao>
        </div>
      ) : (
        <>
          <p className="mt-2 text-[15px] leading-snug text-tinta-suave">
            Seu retorno ajuda a melhorar as próximas análises.
          </p>
          <div role="group" aria-labelledby={idTitulo} className="mt-5 grid grid-cols-2 gap-3">
            <Botao
              variante="secundario"
              tamanho="lg"
              cheio
              carregando={enviando && escolha === null}
              disabled={enviando}
              icone={<ThumbsUp className="size-5" aria-hidden />}
              onClick={() => escolher(1)}
              aria-pressed={salva === 1}
              className={cn(salva === 1 && escolha === null && 'border-petroleo bg-menta')}
            >
              Acertou
            </Botao>
            <Botao
              variante="secundario"
              tamanho="lg"
              cheio
              disabled={enviando}
              icone={<ThumbsDown className="size-5" aria-hidden />}
              onClick={() => escolher(-1)}
              aria-pressed={escolha === -1 || salva === -1}
              className={cn((escolha === -1 || (salva === -1 && escolha === null)) && 'border-petroleo bg-menta')}
            >
              Errou
            </Botao>
          </div>

          {escolha === -1 ? (
            <div className="mt-5">
              <CampoTexto
                rotulo="O que não bateu? (opcional)"
                dica="Por exemplo: a pele é mais seca do que a análise disse."
                value={texto}
                maxLength={500}
                rows={3}
                onChange={(e) => setTexto(e.target.value)}
              />
              <Botao
                tamanho="lg"
                cheio
                className="mt-4"
                carregando={enviando}
                onClick={() => void enviar(-1, texto.trim() || undefined)}
              >
                Enviar retorno
              </Botao>
            </div>
          ) : null}

          {erro ? (
            <Alerta variante="erro" className="mt-4">
              {erro}
            </Alerta>
          ) : null}
        </>
      )}
    </section>
  )
}
