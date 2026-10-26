'use client'

import { ChevronRight, LayoutDashboard, Menu, Package, ScanFace, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { BotaoSair } from '@/components/cliente/botao-sair'
import { Marca } from '@/components/marca/simbolo'
import { BotaoLink } from '@/components/ui/botao'
import { BotaoIcone } from '@/components/ui/botao-icone'
import { cn } from '@/components/ui/cn'
import { Gaveta } from '@/components/ui/gaveta'

type Item = { href: string; rotulo: string; Icone: LucideIcon; exato?: boolean }

const ITENS: Item[] = [
  { href: '/loja', rotulo: 'Painel', Icone: LayoutDashboard, exato: true },
  { href: '/loja/produtos', rotulo: 'Produtos', Icone: Package },
]

type Props = {
  nome: string
  email: string
  children: ReactNode
}

/**
 * Casca do painel da farmácia. No computador: barra lateral fixa. No celular:
 * topo com a marca e o botão de menu, que abre uma gaveta vinda da direita
 * (renderizada fora do <header>, para o desfoque do topo não prender a gaveta).
 */
export function CascaLoja({ nome, email, children }: Props) {
  const caminho = usePathname()
  const [menuAberto, setMenuAberto] = useState(false)

  const ativo = (item: Item) => (item.exato ? caminho === item.href : caminho.startsWith(item.href))

  // Trocou de página: a gaveta fecha.
  useEffect(() => {
    setMenuAberto(false)
  }, [caminho])

  // Passou para a tela larga: a gaveta não faz mais sentido.
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 1024px)')
    const aoMudar = () => {
      if (consulta.matches) setMenuAberto(false)
    }
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  return (
    <div className="min-h-dvh bg-white">
      {/* Barra lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col border-r border-linha bg-nevoa px-5 py-7 lg:flex">
        <Link href="/loja" aria-label="Smart Derma, painel da loja" className="rounded-xl">
          <Marca />
        </Link>
        <p className="mt-1.5 pl-[46px] text-[14px] text-tinta-suave">Painel da farmácia</p>

        <nav aria-label="Painel da loja" className="mt-9 grid gap-1.5">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo(item) ? 'page' : undefined}
              className={cn(
                'flex h-12 items-center gap-3.5 rounded-2xl px-4 text-[16px] font-semibold transition-colors',
                ativo(item) ? 'bg-white text-petroleo shadow-suave' : 'text-tinta-suave hover:bg-white/70 hover:text-tinta',
              )}
            >
              <item.Icone className="size-5" aria-hidden />
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <BotaoLink
          href="/app/analise/nova"
          tamanho="lg"
          cheio
          className="mt-8"
          icone={<ScanFace className="size-5" aria-hidden />}
        >
          Abrir modo totem
        </BotaoLink>

        <div className="mt-auto border-t border-linha pt-5">
          <p className="truncate text-[15px] font-semibold">{nome}</p>
          <p className="truncate text-[14px] text-tinta-suave">{email}</p>
          <BotaoSair className="-ml-3.5 mt-2" />
        </div>
      </aside>

      {/* Topo (celular e tablet) */}
      <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-linha bg-white px-5 lg:hidden">
        <Link href="/loja" aria-label="Smart Derma, painel da loja" className="rounded-xl">
          <Marca />
        </Link>
        <BotaoIcone
          rotulo="Abrir menu"
          aria-expanded={menuAberto}
          aria-controls="menu-loja"
          className="-mr-2"
          onClick={() => setMenuAberto(true)}
        >
          <Menu className="size-6" aria-hidden />
        </BotaoIcone>
      </header>

      <main id="conteudo" className="lg:pl-[272px]">
        <div className="mx-auto w-full max-w-[1180px] px-5 pt-7 pb-20 lg:px-12 lg:pt-12">{children}</div>
      </main>

      <Gaveta
        aberta={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        titulo="Menu da loja"
        cabecalho={<Marca />}
      >
        <div id="menu-loja">
          <nav aria-label="Painel da loja" className="px-5 pt-3">
            {ITENS.map((item, k) => (
              <Link
                key={item.href}
                href={item.href}
                data-foco-inicial={k === 0 ? '' : undefined}
                aria-current={ativo(item) ? 'page' : undefined}
                onClick={() => setMenuAberto(false)}
                className={cn(
                  'gaveta-item flex min-h-14 items-center gap-3.5 border-b border-linha text-[19px] font-semibold',
                  ativo(item) ? 'text-petroleo' : 'text-tinta',
                )}
                style={{ transitionDelay: menuAberto ? `${90 + k * 45}ms` : '0ms' }}
              >
                <item.Icone className="size-5" aria-hidden />
                {item.rotulo}
                <ChevronRight className="ml-auto size-5 text-tinta-suave" aria-hidden />
              </Link>
            ))}
          </nav>
          <div
            className="gaveta-item mt-7 grid gap-3 px-5 pb-8"
            style={{ transitionDelay: menuAberto ? `${90 + ITENS.length * 45}ms` : '0ms' }}
          >
            <BotaoLink
              href="/app/analise/nova"
              tamanho="lg"
              cheio
              icone={<ScanFace className="size-5" aria-hidden />}
              onClick={() => setMenuAberto(false)}
            >
              Abrir modo totem
            </BotaoLink>
            <div className="rounded-2xl bg-nevoa px-4 py-3">
              <p className="truncate text-[15px] font-semibold">{nome}</p>
              <p className="truncate text-[14px] text-tinta-suave">{email}</p>
            </div>
            <BotaoSair className="w-full justify-center" />
          </div>
        </div>
      </Gaveta>
    </div>
  )
}
