'use client'

import { Store } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Marca } from '@/components/marca/simbolo'
import type { Papel } from '@/lib/tipos'
import { BotaoSair } from './botao-sair'

/** Topo da área do cliente e do totem: marca à esquerda, painel (só loja) e "Sair" à direita. */
export function TopoApp({ papel }: { papel: Papel }) {
  const caminho = usePathname()
  // O fluxo da análise tem o próprio topo, com "voltar" e o progresso.
  if (caminho.startsWith('/app/analise/nova')) return null

  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between px-5">
      <Link href="/app" aria-label="Smart Derma, início" className="rounded-xl">
        <Marca />
      </Link>
      <div className="-mr-2 flex items-center gap-0.5">
        {papel === 'loja' ? (
          <Link
            href="/loja"
            className="inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-[15px] font-semibold text-petroleo transition hover:bg-menta"
          >
            <Store className="size-5" aria-hidden />
            Painel
          </Link>
        ) : null}
        <BotaoSair />
      </div>
    </header>
  )
}
