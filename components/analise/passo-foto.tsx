'use client'

import { Brush, Camera, CameraOff, Glasses, ImagePlus, LoaderCircle, Sun, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { MascaraOval } from '@/components/marca/contorno'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { cn } from '@/components/ui/cn'
import { abrirCameraFrontal, capturarDaCamera, fecharCamera, prepararArquivo } from '@/lib/cliente/foto'
import { RodapeAcao } from './rodape-acao'

type Estado = 'abrindo' | 'ligada' | 'indisponivel'
type Previa = { blob: Blob; url: string; origem: 'camera' | 'galeria' }

const DICAS: { Icone: LucideIcon; texto: string }[] = [
  { Icone: Sun, texto: 'Luz natural' },
  { Icone: Brush, texto: 'Sem maquiagem' },
  { Icone: Glasses, texto: 'Sem óculos' },
]

type Props = {
  /** Quando a foto anterior foi recusada: por que e como tirar uma melhor. */
  recusa: { motivo: string; orientacao: string } | null
  aoUsarFoto: (foto: Blob) => void
}

/**
 * Passo da foto. Abre a câmera frontal (e a fecha ao sair do passo), mostra o
 * contorno oval de enquadramento e, depois de capturar, uma prévia para a
 * pessoa aprovar. Sem câmera (ou sem permissão), oferece a galeria e o app de
 * câmera do aparelho.
 */
export function PassoFoto({ recusa, aoUsarFoto }: Props) {
  const [estado, setEstado] = useState<Estado>('abrindo')
  const [previa, setPrevia] = useState<Previa | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const titulo = useRef<HTMLHeadingElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const previaRef = useRef<Previa | null>(null)
  const galeriaRef = useRef<HTMLInputElement>(null)
  const aparelhoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titulo.current?.focus({ preventScroll: true })
  }, [])

  // A câmera abre com o passo e fecha com ele.
  useEffect(() => {
    let cancelado = false
    void abrirCameraFrontal().then((stream) => {
      if (cancelado) {
        fecharCamera(stream)
        return
      }
      streamRef.current = stream
      setEstado(stream ? 'ligada' : 'indisponivel')
    })
    return () => {
      cancelado = true
      fecharCamera(streamRef.current)
      streamRef.current = null
    }
  }, [])

  // Liga o <video> ao stream assim que a câmera estiver pronta.
  useEffect(() => {
    if (estado !== 'ligada') return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return
    video.srcObject = stream
    void video.play().catch(() => undefined)
  }, [estado])

  // Libera a prévia da memória ao sair.
  useEffect(
    () => () => {
      if (previaRef.current) URL.revokeObjectURL(previaRef.current.url)
    },
    [],
  )

  function limparPrevia() {
    if (previaRef.current) URL.revokeObjectURL(previaRef.current.url)
    previaRef.current = null
    setPrevia(null)
  }

  function guardarPrevia(blob: Blob, origem: Previa['origem']) {
    limparPrevia()
    const nova: Previa = { blob, url: URL.createObjectURL(blob), origem }
    previaRef.current = nova
    setPrevia(nova)
  }

  async function capturar() {
    const video = videoRef.current
    if (!video || ocupado) return
    setErro(null)
    setOcupado(true)
    try {
      guardarPrevia(await capturarDaCamera(video), 'camera')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não deu para tirar a foto. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  async function aoEscolherArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    // Limpa para a mesma foto poder ser escolhida de novo.
    e.target.value = ''
    if (!arquivo) return
    setErro(null)
    setOcupado(true)
    try {
      guardarPrevia(await prepararArquivo(arquivo), 'galeria')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu para abrir essa imagem. Tente outra.')
    } finally {
      setOcupado(false)
    }
  }

  function usarFoto() {
    if (!previa) return
    // Privacidade: a luz da câmera apaga na hora, sem esperar a troca de tela.
    fecharCamera(streamRef.current)
    streamRef.current = null
    aoUsarFoto(previa.blob)
  }

  function outraFoto() {
    const veioDaGaleria = previa?.origem === 'galeria'
    limparPrevia()
    if (veioDaGaleria) galeriaRef.current?.click()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 px-5 pt-4 pb-6">
        <h1 ref={titulo} tabIndex={-1} className="text-[28px] leading-[1.08] font-bold outline-hidden">
          Uma foto do seu rosto
        </h1>
        <p className="mt-2 text-[16px] leading-snug text-tinta-suave">Encaixe o rosto no contorno.</p>

        {recusa ? (
          <Alerta variante="aviso" titulo={recusa.motivo} className="mt-4">
            {recusa.orientacao}
          </Alerta>
        ) : null}
        {erro ? (
          <Alerta variante="erro" className="mt-4">
            {erro}
          </Alerta>
        ) : null}

        <ul
          aria-label="Dicas para uma boa foto"
          className="mt-4 grid grid-cols-3 gap-2 text-center text-[14px] leading-tight font-medium text-tinta-suave [@media(max-height:760px)]:hidden"
        >
          {DICAS.map(({ Icone, texto }) => (
            <li key={texto} className="flex flex-col items-center gap-1.5">
              <span className="grid size-9 place-items-center rounded-full bg-menta text-petroleo">
                <Icone className="size-[18px]" aria-hidden />
              </span>
              {texto}
            </li>
          ))}
        </ul>

        <div className="relative mx-auto mt-4 aspect-[3/4] w-[min(100%,calc(min(42dvh,440px)*0.75))] overflow-hidden rounded-[28px] bg-petroleo-escuro">
          {estado === 'ligada' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              aria-label="Visor da câmera"
              className={cn('camera-espelhada absolute inset-0 size-full object-cover', previa && 'invisible')}
            />
          ) : null}

          {previa ? (
            // Foto local (blob), não passa pelo otimizador de imagens.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previa.url} alt="Prévia da foto do rosto" className="absolute inset-0 size-full object-cover" />
          ) : null}

          {estado === 'abrindo' ? (
            <div className="absolute inset-0 grid place-items-center text-white" role="status">
              <div className="flex flex-col items-center gap-3">
                <LoaderCircle className="size-8 animate-spin" aria-hidden />
                <p className="text-[15px] font-medium">Abrindo a câmera</p>
              </div>
            </div>
          ) : null}

          {estado === 'indisponivel' && !previa ? (
            <div className="absolute inset-0 grid place-items-center px-10 text-center text-white">
              <div className="flex flex-col items-center gap-2.5">
                <CameraOff className="size-8" aria-hidden />
                <p className="text-[17px] leading-tight font-semibold">Não conseguimos abrir a câmera</p>
                <p className="text-[14px] leading-snug text-white/80">
                  Libere o acesso à câmera no navegador ou envie uma foto.
                </p>
              </div>
            </div>
          ) : null}

          <MascaraOval className="pointer-events-none absolute inset-0 size-full" solido={Boolean(previa)} />
        </div>
      </div>

      {/* Os campos de arquivo ficam escondidos: os botões desenhados abrem cada um. */}
      <input ref={galeriaRef} type="file" accept="image/*" className="hidden" onChange={aoEscolherArquivo} tabIndex={-1} />
      <input
        ref={aparelhoRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={aoEscolherArquivo}
        tabIndex={-1}
      />

      <RodapeAcao>
        {previa ? (
          <>
            <Botao tamanho="lg" cheio onClick={usarFoto}>
              Usar esta foto
            </Botao>
            <Botao variante="secundario" cheio onClick={outraFoto}>
              {previa.origem === 'camera' ? 'Tirar outra' : 'Escolher outra'}
            </Botao>
          </>
        ) : estado === 'indisponivel' ? (
          <>
            <Botao
              tamanho="lg"
              cheio
              carregando={ocupado}
              icone={<ImagePlus className="size-5" aria-hidden />}
              onClick={() => galeriaRef.current?.click()}
            >
              Enviar da galeria
            </Botao>
            <Botao
              variante="secundario"
              cheio
              disabled={ocupado}
              icone={<Camera className="size-5" aria-hidden />}
              onClick={() => aparelhoRef.current?.click()}
            >
              Abrir a câmera do aparelho
            </Botao>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={capturar}
                disabled={estado !== 'ligada' || ocupado}
                aria-label="Tirar a foto"
                className="group grid size-20 place-items-center rounded-full border-[3px] border-petroleo bg-white transition duration-200 active:scale-95 disabled:opacity-45"
              >
                <span className="grid size-[58px] place-items-center rounded-full bg-petroleo text-white transition-colors duration-200 group-hover:bg-petroleo-escuro">
                  {ocupado ? (
                    <LoaderCircle className="size-7 animate-spin" aria-hidden />
                  ) : (
                    <Camera className="size-7" aria-hidden />
                  )}
                </span>
              </button>
            </div>
            <Botao
              variante="fantasma"
              cheio
              disabled={ocupado}
              icone={<ImagePlus className="size-5" aria-hidden />}
              onClick={() => galeriaRef.current?.click()}
            >
              Enviar da galeria
            </Botao>
          </>
        )}
      </RodapeAcao>
    </div>
  )
}
