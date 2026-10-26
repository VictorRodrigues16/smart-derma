'use client'

import { Botao } from './botao'

/** Conteúdo padrão das telas de erro de /app e /loja. */
export function ErroNaTela({ aoTentarDeNovo }: { aoTentarDeNovo: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-[30px] leading-[1.08] font-bold">Não deu para abrir esta tela</h1>
      <p className="mt-3 max-w-[34ch] text-[17px] leading-relaxed text-tinta-suave">
        Aconteceu um problema ao carregar as informações. Tente de novo. Se continuar, avise a equipe da Smart Derma.
      </p>
      <Botao tamanho="lg" className="mt-8" onClick={aoTentarDeNovo}>
        Tentar de novo
      </Botao>
    </div>
  )
}
