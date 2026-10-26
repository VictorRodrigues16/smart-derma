'use client'

import { ImagePlus, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react'
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Embalagem } from '@/components/produto/embalagem'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { cn } from '@/components/ui/cn'
import { enviarImagemProduto } from '@/lib/cliente/api'
import type { Categoria } from '@/lib/tipos'

type Props = {
  /** Foto já enviada (URL do Vercel Blob). `null` = sem foto. */
  url: string | null
  /** Para mostrar, no estado vazio, a ilustração que o produto usa quando não tem foto. */
  categoria: Categoria | ''
  aoMudar: (url: string | null) => void
  /** Avisa o formulário quando um envio começa e termina, para ele segurar o botão de salvar. */
  aoEnviando: (enviando: boolean) => void
}

/**
 * Campo de foto do produto, desenhado do zero: a área inteira é clicável e
 * aceita arrastar uma imagem. O campo de arquivo de verdade fica escondido.
 * A imagem é reduzida no navegador e enviada na hora; o formulário só guarda
 * a URL que volta.
 */
export function CampoFotoProduto({ url, categoria, aoMudar, aoEnviando }: Props) {
  const idRotulo = useId()
  const arquivoRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [previa, setPrevia] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)

  async function enviar(arquivo: File) {
    if (!arquivo.type.startsWith('image/')) {
      setErro('Escolha um arquivo de imagem, em JPG ou PNG.')
      return
    }
    setErro(null)
    const local = URL.createObjectURL(arquivo)
    setPrevia(local)
    setEnviando(true)
    aoEnviando(true)

    const r = await enviarImagemProduto(arquivo)

    URL.revokeObjectURL(local)
    setPrevia(null)
    setEnviando(false)
    aoEnviando(false)
    if (!r.ok) {
      setErro(r.erro)
      return
    }
    aoMudar(r.url)
  }

  function aoEscolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    // Limpa para a mesma imagem poder ser escolhida de novo.
    e.target.value = ''
    if (arquivo) void enviar(arquivo)
  }

  function aoSoltar(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setArrastando(false)
    const arquivo = e.dataTransfer.files?.[0]
    if (arquivo && !enviando) void enviar(arquivo)
  }

  function remover() {
    setErro(null)
    aoMudar(null)
  }

  const pronta = url !== null && !enviando

  return (
    <div>
      <p id={idRotulo} className="mb-1.5 text-[15px] font-semibold text-tinta">
        Foto da embalagem <span className="font-normal text-tinta-suave">(opcional)</span>
      </p>

      <input
        ref={arquivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-labelledby={idRotulo}
        onChange={aoEscolher}
      />

      {pronta ? (
        <div className="flex items-center gap-4 rounded-[20px] border border-linha p-4">
          {/* Foto no Blob: mostrada direto, sem otimizador, porque acabou de ser enviada. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Foto da embalagem do produto"
            className="size-24 shrink-0 rounded-2xl border border-linha bg-white object-contain p-1.5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold">Foto enviada</p>
            <p className="mt-0.5 text-[14px] leading-snug text-tinta-suave">
              Aparece no catálogo, nas rotinas e no painel.
            </p>
            <div className="-ml-1 mt-2.5 flex flex-wrap gap-1.5">
              <Botao
                variante="fantasma"
                tamanho="sm"
                icone={<RefreshCw className="size-4" aria-hidden />}
                onClick={() => arquivoRef.current?.click()}
              >
                Trocar foto
              </Botao>
              <Botao
                variante="fantasma"
                tamanho="sm"
                className="text-terracota-escuro hover:bg-terracota-trilho"
                icone={<Trash2 className="size-4" aria-hidden />}
                onClick={remover}
              >
                Remover foto
              </Botao>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={enviando}
          onClick={() => arquivoRef.current?.click()}
          onDragEnter={(e) => {
            e.preventDefault()
            setArrastando(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setArrastando(false)}
          onDrop={aoSoltar}
          aria-describedby={idRotulo}
          className={cn(
            'flex w-full items-center gap-4 rounded-[20px] border-2 border-dashed p-4 text-left transition duration-200 disabled:cursor-progress',
            arrastando
              ? 'border-petroleo bg-menta'
              : 'border-petroleo/30 bg-nevoa/50 hover:border-petroleo/60 hover:bg-menta/50',
          )}
        >
          <span className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white">
            {previa ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previa} alt="" className="size-full object-contain p-1.5 opacity-60" />
            ) : categoria ? (
              <Embalagem categoria={categoria} className="size-full" />
            ) : (
              <ImagePlus className="size-8 text-petroleo" aria-hidden />
            )}
            {enviando ? (
              <span className="absolute inset-0 grid place-items-center bg-white/55">
                <LoaderCircle className="size-7 animate-spin text-petroleo" aria-hidden />
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            {enviando ? (
              <>
                <span className="block text-[16px] font-semibold">Enviando a foto</span>
                <span className="mt-0.5 block text-[14px] leading-snug text-tinta-suave" role="status">
                  Aguarde um instante. O botão de salvar libera quando terminar.
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2 text-[16px] font-semibold text-petroleo">
                  <ImagePlus className="size-5 shrink-0" aria-hidden />
                  {arrastando ? 'Solte para enviar' : 'Toque para escolher a foto'}
                </span>
                <span className="mt-1 block text-[14px] leading-snug text-tinta-suave">
                  Ou arraste uma imagem para cá. Sem foto, o produto aparece com a ilustração da categoria.
                </span>
              </>
            )}
          </span>
        </button>
      )}

      <div aria-live="polite">
        {erro ? (
          <Alerta variante="erro" className="mt-3">
            {erro}
          </Alerta>
        ) : null}
      </div>
    </div>
  )
}
