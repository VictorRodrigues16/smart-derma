'use client'

import { useEffect, useId, useRef } from 'react'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { Chip, GrupoOpcoes, Opcao } from '@/components/ui/opcao'
import type { Pergunta } from './perguntas'
import { RodapeAcao } from './rodape-acao'

type Props = {
  pergunta: Pergunta
  /** Texto (uma escolha) ou lista (várias). `undefined` = ainda sem resposta. */
  valor: string | string[] | undefined
  /** Uma escolha: grava o valor. Várias: liga e desliga o valor. */
  aoEscolher: (valor: string) => void
  aoContinuar: () => void
}

export function PassoPergunta({ pergunta, valor, aoEscolher, aoContinuar }: Props) {
  const idTitulo = useId()
  const titulo = useRef<HTMLHeadingElement>(null)

  // Quem usa leitor de tela ouve a pergunta nova assim que ela aparece.
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true })
  }, [])

  const selecionados = Array.isArray(valor) ? valor : []
  const respondida = pergunta.tipo === 'multipla' || typeof valor === 'string'
  const aviso = pergunta.tipo === 'unica' && typeof valor === 'string' ? (pergunta.aviso?.(valor) ?? null) : null
  const rotuloBotao =
    pergunta.tipo === 'multipla' && selecionados.length === 0 ? 'Nada me incomoda, continuar' : 'Continuar'

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-5 pt-4 pb-8">
        <h1 id={idTitulo} ref={titulo} tabIndex={-1} className="text-[30px] leading-[1.08] font-bold outline-hidden">
          {pergunta.titulo}
        </h1>
        {pergunta.ajuda ? (
          <p className="mt-2.5 text-[16px] leading-snug text-tinta-suave">{pergunta.ajuda}</p>
        ) : null}

        {pergunta.tipo === 'multipla' ? (
          <GrupoOpcoes tipo="caixa" rotuloId={idTitulo} className="mt-7 flex flex-wrap gap-2.5">
            {pergunta.opcoes.map((o) => (
              <Chip
                key={o.valor}
                marcado={selecionados.includes(o.valor)}
                aoAlternar={() => aoEscolher(o.valor)}
                className="h-12 px-5 text-base"
              >
                {o.rotulo}
              </Chip>
            ))}
          </GrupoOpcoes>
        ) : (
          <GrupoOpcoes tipo="radio" rotuloId={idTitulo} className="mt-7 grid gap-2.5">
            {pergunta.opcoes.map((o) => (
              <Opcao
                key={o.valor}
                tipo="radio"
                rotulo={o.rotulo}
                detalhe={o.detalhe}
                marcada={valor === o.valor}
                aoAlternar={() => aoEscolher(o.valor)}
              />
            ))}
          </GrupoOpcoes>
        )}

        {aviso ? (
          <Alerta variante="info" className="mt-5">
            {aviso}
          </Alerta>
        ) : null}
      </div>

      <RodapeAcao>
        <Botao tamanho="lg" cheio disabled={!respondida} onClick={aoContinuar}>
          {rotuloBotao}
        </Botao>
      </RodapeAcao>
    </div>
  )
}
