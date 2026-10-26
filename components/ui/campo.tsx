'use client'

import { CircleAlert, Eye, EyeOff, Plus, X } from 'lucide-react'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from './cn'

/**
 * Campos de formulário desenhados para a Smart Derma. Todos têm rótulo visível,
 * dica, mensagem de erro por baixo (anunciada para leitor de tela) e `aria-invalid`.
 */

type Base = {
  rotulo: string
  dica?: string
  erro?: string
  obrigatorio?: boolean
}

const CAIXA =
  'w-full rounded-2xl border bg-white text-base text-tinta outline-hidden transition placeholder:text-tinta-suave/85 focus:ring-4 disabled:bg-nevoa disabled:text-tinta-suave'
const ESTADO_OK = 'border-linha hover:border-petroleo/40 focus:border-petroleo focus:ring-petroleo/15'
const ESTADO_ERRO =
  'border-terracota-escuro bg-terracota-trilho/30 focus:border-terracota-escuro focus:ring-terracota/25'

function RotuloCampo({ id, texto, obrigatorio }: { id: string; texto: string; obrigatorio?: boolean }) {
  return (
    <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold text-tinta">
      {texto}
      {obrigatorio ? (
        <span aria-hidden className="ml-0.5 text-terracota-escuro">
          *
        </span>
      ) : null}
    </label>
  )
}

function Mensagens({ id, dica, erro }: { id: string; dica?: string; erro?: string }) {
  return (
    <div aria-live="polite">
      {erro ? (
        <p id={`${id}-erro`} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-terracota-escuro">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{erro}</span>
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="mt-1.5 text-sm text-tinta-suave">
          {dica}
        </p>
      ) : null}
    </div>
  )
}

function descritoPor(id: string, dica?: string, erro?: string) {
  if (erro) return `${id}-erro`
  if (dica) return `${id}-dica`
  return undefined
}

/* ------------------------------------------------------------------ */
/* Texto, e-mail                                                       */
/* ------------------------------------------------------------------ */

type CampoProps = Base &
  Omit<ComponentProps<'input'>, 'className'> & {
    className?: string
    icone?: ReactNode
    /** Conteúdo à direita, dentro do campo (ex.: botão de mostrar senha). */
    direita?: ReactNode
  }

export function Campo({ rotulo, dica, erro, obrigatorio, className, icone, direita, id: idExterno, ...resto }: CampoProps) {
  const idGerado = useId()
  const id = idExterno ?? idGerado
  return (
    <div className={className}>
      <RotuloCampo id={id} texto={rotulo} obrigatorio={obrigatorio} />
      <div className="relative">
        {icone ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-tinta-suave">{icone}</span>
        ) : null}
        <input
          id={id}
          aria-required={obrigatorio || undefined}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritoPor(id, dica, erro)}
          className={cn('h-[52px] px-4', CAIXA, erro ? ESTADO_ERRO : ESTADO_OK, icone && 'pl-11', direita && 'pr-14')}
          {...resto}
        />
        {direita ? <div className="absolute inset-y-0 right-1 flex items-center">{direita}</div> : null}
      </div>
      <Mensagens id={id} dica={dica} erro={erro} />
    </div>
  )
}

export function CampoSenha(props: Omit<CampoProps, 'type' | 'direita'>) {
  const [visivel, setVisivel] = useState(false)
  return (
    <Campo
      {...props}
      type={visivel ? 'text' : 'password'}
      direita={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Esconder a senha' : 'Mostrar a senha'}
          aria-pressed={visivel}
          className="inline-flex size-11 items-center justify-center rounded-full text-tinta-suave transition hover:bg-menta hover:text-petroleo"
        >
          {visivel ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      }
    />
  )
}

/* ------------------------------------------------------------------ */
/* Texto longo                                                         */
/* ------------------------------------------------------------------ */

type CampoTextoProps = Base &
  Omit<ComponentProps<'textarea'>, 'className' | 'value'> & {
    className?: string
    value: string
  }

export function CampoTexto({
  rotulo,
  dica,
  erro,
  obrigatorio,
  className,
  value,
  maxLength,
  rows = 4,
  id: idExterno,
  ...resto
}: CampoTextoProps) {
  const idGerado = useId()
  const id = idExterno ?? idGerado
  return (
    <div className={className}>
      <RotuloCampo id={id} texto={rotulo} obrigatorio={obrigatorio} />
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, dica, erro)}
        className={cn('min-h-[112px] resize-y px-4 py-3.5 leading-relaxed', CAIXA, erro ? ESTADO_ERRO : ESTADO_OK)}
        {...resto}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Mensagens id={id} dica={dica} erro={erro} />
        </div>
        {maxLength ? (
          <p className="mt-1.5 shrink-0 text-xs text-tinta-suave tabular-nums">
            {value.length}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Valor em reais (guarda centavos)                                    */
/* ------------------------------------------------------------------ */

type CampoMoedaProps = Base & {
  valor: number | null
  aoMudar: (centavos: number | null) => void
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
}

function formatarReais(centavos: number | null) {
  if (centavos === null) return ''
  return (centavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CampoMoeda({
  rotulo,
  dica,
  erro,
  obrigatorio,
  className,
  valor,
  aoMudar,
  id: idExterno,
  disabled,
  placeholder = '0,00',
}: CampoMoedaProps) {
  const idGerado = useId()
  const id = idExterno ?? idGerado
  const ref = useRef<HTMLInputElement>(null)
  const texto = formatarReais(valor)

  // A máscara reescreve o número a cada tecla; o cursor precisa ficar no fim,
  // senão ele cai no meio e embaralha o valor.
  useLayoutEffect(() => {
    const el = ref.current
    if (el && document.activeElement === el) el.setSelectionRange(el.value.length, el.value.length)
  }, [texto])

  function aoDigitar(e: ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 8)
    aoMudar(digitos ? Number.parseInt(digitos, 10) : null)
  }

  function cursorNoFim() {
    const el = ref.current
    if (!el) return
    requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length))
  }

  return (
    <div className={className}>
      <RotuloCampo id={id} texto={rotulo} obrigatorio={obrigatorio} />
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-tinta-suave">
          R$
        </span>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={texto}
          onChange={aoDigitar}
          onFocus={cursorNoFim}
          onClick={cursorNoFim}
          aria-required={obrigatorio || undefined}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritoPor(id, dica, erro)}
          className={cn('h-[52px] pr-4 pl-12 tabular-nums', CAIXA, erro ? ESTADO_ERRO : ESTADO_OK)}
        />
      </div>
      <Mensagens id={id} dica={dica} erro={erro} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Número inteiro                                                      */
/* ------------------------------------------------------------------ */

type CampoNumeroProps = Base & {
  valor: string
  aoMudar: (valor: string) => void
  maxDigitos?: number
  className?: string
  id?: string
  disabled?: boolean
  placeholder?: string
}

export function CampoNumero({
  rotulo,
  dica,
  erro,
  obrigatorio,
  className,
  valor,
  aoMudar,
  maxDigitos = 6,
  id: idExterno,
  disabled,
  placeholder = '0',
}: CampoNumeroProps) {
  const idGerado = useId()
  const id = idExterno ?? idGerado
  return (
    <div className={className}>
      <RotuloCampo id={id} texto={rotulo} obrigatorio={obrigatorio} />
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => aoMudar(e.target.value.replace(/\D/g, '').slice(0, maxDigitos).replace(/^0+(?=\d)/, ''))}
        aria-required={obrigatorio || undefined}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, dica, erro)}
        className={cn('h-[52px] px-4 tabular-nums', CAIXA, erro ? ESTADO_ERRO : ESTADO_OK)}
      />
      <Mensagens id={id} dica={dica} erro={erro} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Lista de etiquetas (ex.: ativos do produto)                         */
/* ------------------------------------------------------------------ */

type CampoEtiquetasProps = Base & {
  valores: string[]
  aoMudar: (valores: string[]) => void
  maximo?: number
  placeholder?: string
  className?: string
  id?: string
}

export function CampoEtiquetas({
  rotulo,
  dica,
  erro,
  obrigatorio,
  className,
  valores,
  aoMudar,
  maximo = 8,
  placeholder,
  id: idExterno,
}: CampoEtiquetasProps) {
  const idGerado = useId()
  const id = idExterno ?? idGerado
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)

  function adicionar() {
    const limpo = texto.trim().replace(/\s+/g, ' ')
    if (!limpo) return
    if (limpo.length < 2) return setAviso('Escreva pelo menos 2 letras.')
    if (limpo.length > 60) return setAviso('Use no máximo 60 caracteres.')
    if (valores.some((v) => v.toLowerCase() === limpo.toLowerCase())) return setAviso('Esse item já está na lista.')
    if (valores.length >= maximo) return setAviso(`A lista aceita no máximo ${maximo} itens.`)
    aoMudar([...valores, limpo])
    setTexto('')
    setAviso(null)
  }

  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      adicionar()
    } else if (e.key === 'Backspace' && !texto && valores.length) {
      aoMudar(valores.slice(0, -1))
    }
  }

  const mensagem = erro ?? aviso ?? undefined

  return (
    <div className={className}>
      <RotuloCampo id={id} texto={rotulo} obrigatorio={obrigatorio} />
      {valores.length ? (
        <ul className="mb-2.5 flex flex-wrap gap-2" aria-label={`${rotulo}: itens adicionados`}>
          {valores.map((valor) => (
            <li
              key={valor}
              className="inline-flex h-11 items-center gap-0.5 rounded-full bg-menta pr-1 pl-4 text-[15px] font-medium text-petroleo"
            >
              <span>{valor}</span>
              <button
                type="button"
                onClick={() => aoMudar(valores.filter((v) => v !== valor))}
                aria-label={`Remover ${valor}`}
                className="inline-flex size-11 items-center justify-center rounded-full transition hover:bg-petroleo/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={texto}
          placeholder={placeholder}
          onChange={(e) => {
            setTexto(e.target.value)
            if (aviso) setAviso(null)
          }}
          onKeyDown={aoTeclar}
          onBlur={adicionar}
          aria-invalid={mensagem ? true : undefined}
          aria-describedby={descritoPor(id, dica, mensagem)}
          className={cn('h-[52px] min-w-0 flex-1 px-4', CAIXA, mensagem ? ESTADO_ERRO : ESTADO_OK)}
        />
        <button
          type="button"
          onClick={adicionar}
          aria-label="Adicionar à lista"
          className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-2xl border border-petroleo/35 bg-white text-petroleo transition hover:border-petroleo hover:bg-menta"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>
      <Mensagens id={id} dica={dica} erro={mensagem} />
    </div>
  )
}
