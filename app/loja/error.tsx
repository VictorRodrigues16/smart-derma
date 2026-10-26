'use client'

import { ErroNaTela } from '@/components/ui/erro-na-tela'

export default function ErroNoPainelDaLoja({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErroNaTela aoTentarDeNovo={reset} />
}
