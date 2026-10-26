'use client'

import { History, UserX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Botao } from '@/components/ui/botao'
import { apagarDados } from '@/lib/cliente/api'

type Escopo = 'historico' | 'conta'

const TEXTOS: Record<Escopo, { acao: string; pergunta: string; confirmar: string }> = {
  historico: {
    acao: 'Apagar meu histórico',
    pergunta: 'Apagar todas as suas análises? Isso não pode ser desfeito.',
    confirmar: 'Apagar análises',
  },
  conta: {
    acao: 'Excluir minha conta',
    pergunta: 'Excluir sua conta e todas as suas análises? Isso não pode ser desfeito.',
    confirmar: 'Excluir conta',
  },
}

/** Direito de apagar os dados (LGPD), com confirmação na própria tela. */
export function SeusDados({ temAnalises, className }: { temAnalises: boolean; className?: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState<Escopo | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function apagar(escopo: Escopo) {
    setEnviando(true)
    setErro(null)
    const resposta = await apagarDados(escopo)
    setEnviando(false)
    if (!resposta.ok) {
      setErro(resposta.erro)
      return
    }
    setConfirmando(null)
    if (resposta.destino) router.replace(resposta.destino)
    router.refresh()
  }

  return (
    <section className={className} aria-labelledby="titulo-seus-dados">
      <h2 id="titulo-seus-dados" className="text-[22px] leading-tight font-semibold">
        Seus dados
      </h2>
      <p className="mt-2 text-[15px] leading-snug text-tinta-suave">
        Guardamos o resultado das suas análises: tipo de pele, notas e produtos indicados. A foto nunca é guardada. Você pode
        apagar tudo quando quiser.
      </p>

      {confirmando ? (
        <div className="mt-4 rounded-[22px] border border-linha bg-nevoa p-5" role="group" aria-live="polite">
          <p className="text-[16px] leading-snug font-semibold">{TEXTOS[confirmando].pergunta}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Botao tamanho="sm" carregando={enviando} onClick={() => apagar(confirmando)}>
              {TEXTOS[confirmando].confirmar}
            </Botao>
            <Botao tamanho="sm" variante="secundario" disabled={enviando} onClick={() => setConfirmando(null)}>
              Cancelar
            </Botao>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-3">
          {temAnalises ? (
            <Botao
              tamanho="sm"
              variante="secundario"
              icone={<History className="size-4" aria-hidden />}
              onClick={() => setConfirmando('historico')}
            >
              {TEXTOS.historico.acao}
            </Botao>
          ) : null}
          <Botao
            tamanho="sm"
            variante="fantasma"
            icone={<UserX className="size-4" aria-hidden />}
            onClick={() => setConfirmando('conta')}
          >
            {TEXTOS.conta.acao}
          </Botao>
        </div>
      )}

      {erro ? (
        <p role="alert" className="mt-3 text-[15px] leading-snug text-terracota-escuro">
          {erro}
        </p>
      ) : null}
    </section>
  )
}
