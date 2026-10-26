'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/components/ui/cn'
import type { ProdutoVitrine } from '@/lib/tipos'
import { Embalagem } from './embalagem'

type Props = {
  produto: Pick<ProdutoVitrine, 'nome' | 'categoria' | 'imagemUrl'>
  /** Define o tamanho da caixa (ex.: `size-16`). A foto e a ilustração ocupam a mesma caixa. */
  className?: string
  /** Atributo `sizes` do next/image: a largura em que a foto aparece. */
  tamanhos?: string
  /** Texto alternativo. Deixe vazio quando o nome do produto já está escrito ao lado. */
  descricao?: string
}

/**
 * Onde um produto aparece: a foto da embalagem (guardada no Vercel Blob) sobre
 * fundo claro, sem cortar, ou, quando não há foto, a ilustração da categoria.
 * Se a foto não carregar, cai na ilustração.
 */
export function ProdutoImagem({ produto, className, tamanhos = '96px', descricao = '' }: Props) {
  const [urlComFalha, setUrlComFalha] = useState<string | null>(null)
  const url = produto.imagemUrl

  if (url && url !== urlComFalha) {
    return (
      <span
        className={cn('relative block shrink-0 overflow-hidden rounded-[22%] border border-linha bg-white', className)}
      >
        <Image
          src={url}
          alt={descricao}
          fill
          sizes={tamanhos}
          onError={() => setUrlComFalha(url)}
          className="object-contain p-[7%]"
        />
      </span>
    )
  }
  return <Embalagem categoria={produto.categoria} className={cn('shrink-0', className)} />
}
