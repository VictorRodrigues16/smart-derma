'use client'

import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from './cn'

type Props = {
  aberta: boolean
  aoFechar: () => void
  /** Nome acessível do diálogo (e título, quando não houver `cabecalho`). */
  titulo: string
  /** "menu" tem 380 px; "painel" tem 560 px (formulários). */
  largura?: 'menu' | 'painel'
  /** Troca o título por outro conteúdo no topo (ex.: a marca). */
  cabecalho?: ReactNode
  rodape?: ReactNode
  children: ReactNode
}

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Gaveta lateral que entra da direita para a esquerda. Fica sempre no DOM
 * (fechada, está `inert` e invisível) para a transição funcionar nos dois sentidos.
 *
 * Acessibilidade: role="dialog" + aria-modal, Esc fecha, o foco vai para o
 * primeiro item (ou o que tiver `data-foco-inicial`) ao abrir e volta para o
 * botão que abriu ao fechar, o Tab não escapa e a página não rola por baixo.
 * O efeito depende só de `aberta`: quem digita em campo dentro da gaveta não
 * perde o foco a cada tecla.
 */
export function Gaveta({ aberta, aoFechar, titulo, largura = 'menu', cabecalho, rodape, children }: Props) {
  const painel = useRef<HTMLDivElement>(null)
  const aoFecharRef = useRef(aoFechar)

  useEffect(() => {
    aoFecharRef.current = aoFechar
  })

  useEffect(() => {
    if (!aberta) return

    const quemAbriu = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const html = document.documentElement
    const overflowAntes = html.style.overflow
    const paddingAntes = html.style.paddingRight
    // Sem a barra de rolagem a página "pula" para o lado; compensa o espaço dela.
    const barra = window.innerWidth - html.clientWidth
    html.style.overflow = 'hidden'
    if (barra > 0) html.style.paddingRight = `${barra}px`

    const foco = window.setTimeout(() => {
      const alvo =
        painel.current?.querySelector<HTMLElement>('[data-foco-inicial]') ??
        painel.current?.querySelector<HTMLElement>(FOCAVEIS)
      ;(alvo ?? painel.current)?.focus()
    }, 80)

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        aoFecharRef.current()
        return
      }
      if (e.key !== 'Tab' || !painel.current) return
      const itens = Array.from(painel.current.querySelectorAll<HTMLElement>(FOCAVEIS)).filter(
        (el) => el.offsetParent !== null,
      )
      const primeiro = itens[0]
      const ultimo = itens[itens.length - 1]
      if (!primeiro || !ultimo) return
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)

    return () => {
      window.clearTimeout(foco)
      document.removeEventListener('keydown', aoTeclar)
      html.style.overflow = overflowAntes
      html.style.paddingRight = paddingAntes
      quemAbriu?.focus()
    }
  }, [aberta])

  const estado = aberta ? 'sim' : 'nao'

  return (
    <>
      <div className="gaveta-fundo" data-aberto={estado} onClick={aoFechar} aria-hidden />
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="gaveta focus:outline-hidden"
        data-aberto={estado}
        data-largura={largura === 'painel' ? 'painel' : undefined}
        inert={!aberta}
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between gap-3 border-b border-linha px-5">
          {cabecalho ?? <h2 className="font-titulo text-[22px] font-semibold text-tinta">{titulo}</h2>}
          <button
            type="button"
            aria-label="Fechar"
            onClick={aoFechar}
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-tinta transition hover:bg-menta hover:text-petroleo"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {rodape ? (
          <div className={cn('shrink-0 border-t border-linha bg-white px-5 pt-4 pb-seguro')}>{rodape}</div>
        ) : null}
      </div>
    </>
  )
}
