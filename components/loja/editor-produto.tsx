'use client'

import { CircleAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { Campo, CampoEtiquetas, CampoMoeda, CampoNumero, CampoTexto } from '@/components/ui/campo'
import { Gaveta } from '@/components/ui/gaveta'
import { Interruptor } from '@/components/ui/interruptor'
import { Chip, GrupoOpcoes } from '@/components/ui/opcao'
import { Segmentado } from '@/components/ui/segmentado'
import { atualizarProduto, criarProduto } from '@/lib/cliente/api'
import {
  CATEGORIAS,
  CHAVES_MEDIDA,
  ProdutoEntradaSchema,
  ROTULO_CATEGORIA,
  ROTULO_MEDIDA,
  ROTULO_TIPO_PELE,
  ROTULO_TURNO,
  TIPOS_PELE,
  TURNOS,
  type ProdutoVitrine,
} from '@/lib/tipos'
import { CampoFotoProduto } from './campo-foto-produto'
import { apenasMudancas, montarEntrada, validar, valoresIniciais, type Erros, type Valores } from './produto-formulario'

/* ------------------------------------------------------------------ */
/* Peças do formulário                                                 */
/* ------------------------------------------------------------------ */

function Grupo({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="border-t border-linha pt-8 first:border-t-0 first:pt-0">
      <h3 className="font-sans text-[18px] leading-tight font-semibold">{titulo}</h3>
      {descricao ? <p className="mt-1 text-[14px] leading-snug text-tinta-suave">{descricao}</p> : null}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  )
}

/** Várias opções em pílulas, com rótulo, dica e erro. O erro faz o grupo poder receber foco. */
function GrupoDeChips({
  id,
  rotulo,
  dica,
  erro,
  obrigatorio = true,
  children,
}: {
  id: string
  rotulo: string
  dica?: string
  erro?: string
  obrigatorio?: boolean
  children: ReactNode
}) {
  return (
    <div id={`campo-${id}`} tabIndex={-1} data-invalido={erro ? 'true' : undefined} className="outline-hidden">
      <p id={`rotulo-${id}`} className="mb-2.5 text-[15px] font-semibold">
        {rotulo}
        {obrigatorio ? (
          <span aria-hidden className="ml-0.5 text-terracota-escuro">
            *
          </span>
        ) : null}
      </p>
      <GrupoOpcoes tipo="caixa" rotuloId={`rotulo-${id}`} className="flex flex-wrap gap-2">
        {children}
      </GrupoOpcoes>
      {erro ? (
        <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-terracota-escuro" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{erro}</span>
        </p>
      ) : dica ? (
        <p className="mt-2 text-sm text-tinta-suave">{dica}</p>
      ) : null}
    </div>
  )
}

function LinhaInterruptor({
  titulo,
  texto,
  ligado,
  aoAlternar,
}: {
  titulo: string
  texto: string
  ligado: boolean
  aoAlternar: () => void
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[16px] leading-tight font-semibold">{titulo}</p>
        <p className="mt-1 text-[14px] leading-snug text-tinta-suave">{texto}</p>
      </div>
      <Interruptor ligado={ligado} aoAlternar={aoAlternar} rotulo={titulo} className="mt-0.5" />
    </div>
  )
}

function alternarNaLista<T extends string>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]
}

/* ------------------------------------------------------------------ */
/* Formulário                                                          */
/* ------------------------------------------------------------------ */

type FormularioProps = {
  produto: ProdutoVitrine | null
  aoSalvo: (mensagem: string) => void
  aoSujar: (sujo: boolean) => void
  aoSalvando: (salvando: boolean) => void
  aoEnviandoFoto: (enviando: boolean) => void
}

/**
 * Só guarda o que a pessoa mexeu (`mexido`). O que aparece é o produto salvo
 * com as mexidas por cima: se a lista for atualizada por fora enquanto o painel
 * está aberto, os campos que ela não tocou acompanham.
 */
function FormularioProduto({ produto, aoSalvo, aoSujar, aoSalvando, aoEnviandoFoto }: FormularioProps) {
  const base = useMemo(() => valoresIniciais(produto), [produto])
  const [mexido, setMexido] = useState<Partial<Valores>>({})
  const v: Valores = { ...base, ...mexido }

  const [erros, setErros] = useState<Erros>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const formulario = useRef<HTMLFormElement>(null)
  const aviso = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aoSujar(Object.keys(mexido).length > 0)
  }, [mexido, aoSujar])

  function mudar<K extends keyof Valores>(chave: K, valor: Valores[K]) {
    setMexido((m) => ({ ...m, [chave]: valor }) as Partial<Valores>)
    if (erros[chave]) setErros((e) => ({ ...e, [chave]: undefined }))
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (salvando || enviandoFoto) return
    setErroGeral(null)

    const encontrados = validar(v)
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) {
      window.setTimeout(() => {
        const alvo = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalido="true"]')
        alvo?.focus()
        alvo?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 0)
      return
    }

    const conferido = ProdutoEntradaSchema.safeParse(montarEntrada(v))
    if (!conferido.success) {
      setErroGeral('Revise os campos: algum valor não passou na conferência.')
      return
    }

    let mudancas: ReturnType<typeof apenasMudancas> | null = null
    if (produto) {
      mudancas = apenasMudancas(produto, conferido.data)
      if (Object.keys(mudancas).length === 0) {
        aoSalvo('Nada mudou, então nada foi salvo.')
        return
      }
    }

    setSalvando(true)
    aoSalvando(true)
    const r = produto && mudancas ? await atualizarProduto(produto.id, mudancas) : await criarProduto(conferido.data)
    setSalvando(false)
    aoSalvando(false)

    if (!r.ok) {
      setErroGeral(r.erro)
      window.setTimeout(() => aviso.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0)
      return
    }
    aoSalvo(produto ? 'Alterações salvas.' : 'Produto cadastrado.')
  }

  return (
    <form id="form-produto" ref={formulario} onSubmit={enviar} noValidate className="grid gap-8 px-5 py-6">
      <div ref={aviso} aria-live="polite">
        {erroGeral ? <Alerta variante="erro">{erroGeral}</Alerta> : null}
      </div>

      <Grupo titulo="Foto">
        <CampoFotoProduto
          url={v.imagemUrl}
          categoria={v.categoria}
          aoMudar={(url) => mudar('imagemUrl', url)}
          aoEnviando={(enviando) => {
            setEnviandoFoto(enviando)
            aoEnviandoFoto(enviando)
          }}
        />
      </Grupo>

      <Grupo titulo="Identificação">
        <Campo
          rotulo="Código"
          name="codigo"
          obrigatorio
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={20}
          placeholder="SD-HID-05"
          dica="É o código que a IA usa para se referir ao produto. Letras, números e hífen."
          value={v.codigo}
          onChange={(e) => mudar('codigo', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
          erro={erros.codigo}
        />
        <Campo
          rotulo="Nome do produto"
          name="nome"
          obrigatorio
          autoComplete="off"
          maxLength={120}
          value={v.nome}
          onChange={(e) => mudar('nome', e.target.value)}
          erro={erros.nome}
        />
        <Campo
          rotulo="Marca"
          name="marca"
          obrigatorio
          autoComplete="off"
          maxLength={60}
          value={v.marca}
          onChange={(e) => mudar('marca', e.target.value)}
          erro={erros.marca}
        />
        <GrupoDeChips id="categoria" rotulo="Categoria" erro={erros.categoria}>
          {CATEGORIAS.map((c) => (
            <Chip key={c} marcado={v.categoria === c} aoAlternar={() => mudar('categoria', c)}>
              {ROTULO_CATEGORIA[c]}
            </Chip>
          ))}
        </GrupoDeChips>
      </Grupo>

      <Grupo
        titulo="O que a IA lê"
        descricao="A IA usa estes textos para decidir se o produto serve para a pessoa e para explicar como usar."
      >
        <CampoTexto
          rotulo="Descrição"
          obrigatorio
          maxLength={400}
          rows={4}
          dica="Diga para que serve e para quem é indicado."
          value={v.descricao}
          onChange={(e) => mudar('descricao', e.target.value)}
          erro={erros.descricao}
        />
        <CampoEtiquetas
          rotulo="Ativos principais"
          placeholder="Ex.: Niacinamida 10%"
          dica="Digite o ativo e aperte Enter. Até 8."
          valores={v.ativos}
          aoMudar={(ativos) => mudar('ativos', ativos)}
          erro={erros.ativos}
        />
        <CampoTexto
          rotulo="Modo de uso"
          obrigatorio
          maxLength={300}
          rows={3}
          dica="Aparece para a pessoa no resultado da análise."
          value={v.modoDeUso}
          onChange={(e) => mudar('modoDeUso', e.target.value)}
          erro={erros.modoDeUso}
        />
      </Grupo>

      <Grupo titulo="Para quem serve">
        <GrupoDeChips id="tiposPele" rotulo="Tipos de pele" erro={erros.tiposPele}>
          {TIPOS_PELE.map((t) => (
            <Chip key={t} marcado={v.tiposPele.includes(t)} aoAlternar={() => mudar('tiposPele', alternarNaLista(v.tiposPele, t))}>
              {ROTULO_TIPO_PELE[t]}
            </Chip>
          ))}
        </GrupoDeChips>
        <GrupoDeChips
          id="indicacoes"
          rotulo="O que o produto trata"
          dica="As características da análise que o produto ajuda a cuidar."
          erro={erros.indicacoes}
        >
          {CHAVES_MEDIDA.map((c) => (
            <Chip
              key={c}
              marcado={v.indicacoes.includes(c)}
              aoAlternar={() => mudar('indicacoes', alternarNaLista(v.indicacoes, c))}
            >
              {ROTULO_MEDIDA[c]}
            </Chip>
          ))}
        </GrupoDeChips>
        <div>
          <p className="mb-2.5 text-[15px] font-semibold">Quando usar</p>
          <Segmentado
            rotuloAcessivel="Quando usar o produto"
            valor={v.turno}
            aoMudar={(turno) => mudar('turno', turno)}
            itens={TURNOS.map((t) => ({ valor: t, rotulo: ROTULO_TURNO[t] }))}
          />
        </div>
      </Grupo>

      <Grupo titulo="Venda">
        <div className="grid gap-5 sm:grid-cols-2">
          <CampoMoeda
            rotulo="Preço"
            obrigatorio
            valor={v.precoCentavos}
            aoMudar={(centavos) => mudar('precoCentavos', centavos)}
            erro={erros.precoCentavos}
          />
          <CampoNumero
            rotulo="Estoque"
            obrigatorio
            maxDigitos={6}
            valor={v.estoque}
            aoMudar={(estoque) => mudar('estoque', estoque)}
            erro={erros.estoque}
          />
        </div>
        <Campo
          rotulo="Corredor ou prateleira"
          name="corredor"
          obrigatorio
          autoComplete="off"
          maxLength={40}
          placeholder="Corredor B2"
          dica="Aparece para a pessoa achar o produto na loja."
          value={v.corredor}
          onChange={(e) => mudar('corredor', e.target.value)}
          erro={erros.corredor}
        />
      </Grupo>

      <Grupo
        titulo="Travas de segurança"
        descricao="O sistema tira o produto da lista antes de a IA ver o catálogo, então ela nem chega a considerar o produto para essa pessoa."
      >
        <LinhaInterruptor
          titulo="Não indicar na gravidez e na amamentação"
          texto="Para ácidos fortes, retinoides e outros ativos que pedem orientação médica nessa fase. Também fica de fora para quem prefere não informar."
          ligado={v.evitarGestante}
          aoAlternar={() => mudar('evitarGestante', !v.evitarGestante)}
        />
        <LinhaInterruptor
          titulo="Não indicar para pele sensível"
          texto="Para fórmulas que podem irritar, como ácidos e esfoliantes. Fica de fora quando a pessoa diz que tem pele sensível."
          ligado={v.evitarSensivel}
          aoAlternar={() => mudar('evitarSensivel', !v.evitarSensivel)}
        />
        <LinhaInterruptor
          titulo="Indicar só para maiores de 18 anos"
          texto="Quem responde que tem menos de 18 anos não recebe este produto."
          ligado={v.apenasAdulto}
          aoAlternar={() => mudar('apenasAdulto', !v.apenasAdulto)}
        />
      </Grupo>

      <Grupo titulo="Situação">
        <LinhaInterruptor
          titulo="Produto ativo"
          texto="Só produtos ativos e com estoque entram nas rotinas. Desative para tirar da indicação sem apagar o cadastro."
          ligado={v.ativo}
          aoAlternar={() => mudar('ativo', !v.ativo)}
        />
      </Grupo>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Painel lateral                                                      */
/* ------------------------------------------------------------------ */

type EditorProps = {
  aberto: boolean
  /** `null` com o painel aberto = produto novo. */
  produto: ProdutoVitrine | null
  /** Muda a cada abertura e zera o formulário. */
  versao: number
  aoFechar: () => void
  aoSalvo: (mensagem: string) => void
}

export function EditorProduto({ aberto, produto, versao, aoFechar, aoSalvo }: EditorProps) {
  const [sujo, setSujo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const continuarEditando = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!aberto) setConfirmarSaida(false)
  }, [aberto])

  // A pergunta de descartar aparece no rodapé: o foco vai junto.
  useEffect(() => {
    if (confirmarSaida) continuarEditando.current?.focus()
  }, [confirmarSaida])

  // Esc, fundo escuro e "Cancelar" passam por aqui: com mudanças soltas, pergunta antes.
  function pedirParaFechar() {
    if (salvando) return
    if (sujo || enviandoFoto) {
      setConfirmarSaida(true)
      return
    }
    aoFechar()
  }

  const rodape = confirmarSaida ? (
    <div>
      <p className="text-[16px] leading-tight font-semibold">Descartar o que você mudou?</p>
      <p className="mt-1 text-[14px] leading-snug text-tinta-suave">As alterações deste formulário serão perdidas.</p>
      <div className="mt-3.5 grid grid-cols-2 gap-3">
        <Botao ref={continuarEditando} variante="secundario" onClick={() => setConfirmarSaida(false)}>
          Continuar editando
        </Botao>
        <Botao onClick={aoFechar}>Descartar</Botao>
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <Botao variante="secundario" disabled={salvando} onClick={pedirParaFechar}>
        Cancelar
      </Botao>
      <Botao type="submit" form="form-produto" carregando={salvando} disabled={enviandoFoto}>
        {enviandoFoto ? 'Enviando a foto…' : produto ? 'Salvar alterações' : 'Cadastrar produto'}
      </Botao>
    </div>
  )

  return (
    <Gaveta
      aberta={aberto}
      aoFechar={pedirParaFechar}
      titulo={produto ? 'Editar produto' : 'Novo produto'}
      largura="painel"
      rodape={rodape}
    >
      <FormularioProduto
        key={`${versao}-${produto?.id ?? 'novo'}`}
        produto={produto}
        aoSalvo={aoSalvo}
        aoSujar={setSujo}
        aoSalvando={setSalvando}
        aoEnviandoFoto={setEnviandoFoto}
      />
    </Gaveta>
  )
}
