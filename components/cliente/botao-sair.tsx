'use client'

import { LoaderCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/components/ui/cn'
import { sair } from '@/lib/cliente/api'

/** Encerra a sessão no servidor e volta para o login. */
export function BotaoSair({ className }: { className?: string }) {
  const router = useRouter()
  const [saindo, setSaindo] = useState(false)
  const [falhou, setFalhou] = useState(false)

  async function aoClicar() {
    if (saindo) return
    setSaindo(true)
    setFalhou(false)
    const r = await sair()
    if (!r.ok) {
      setSaindo(false)
      setFalhou(true)
      return
    }
    router.replace('/entrar')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={saindo}
      className={cn(
        'inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-[15px] font-semibold text-tinta-suave transition hover:bg-menta hover:text-petroleo disabled:opacity-60',
        className,
      )}
    >
      {saindo ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <LogOut className="size-5" aria-hidden />}
      {falhou ? 'Não saiu. Tentar de novo' : 'Sair'}
    </button>
  )
}
