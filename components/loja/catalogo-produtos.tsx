'use client'

import { ArrowDown, ArrowUp, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ProdutoImagem } from '@/components/produto/produto-imagem'
import { Alerta } from '@/components/ui/alerta'
import { Botao } from '@/components/ui/botao'
import { cn } from '@/components/ui/cn'
import { Interruptor } from '@/components/ui/interruptor'
import { Chip } from '@/components/ui/opcao'
import { atualizarProduto } from '@/lib/cliente/api'
import { reais } from '@/lib/formatar'
import { CATEGORIAS, ROTULO_CATEGORIA, type Categoria, type ProdutoVitrine } from '@/lib/tipos'
import { EditorProduto } from './editor-produto'

/* ------------------------------------------------------------------ */
/* Filtros e ordem                                                     */
/* ------------------------------------------------------------------ */

type Situacao = 'todos' | 'ativos' | 'inativos'
type Estoque = 'todos' | 'com' | 'esgotado'
type Faixa = 'todos' | 'ate_50' | 'ate_80' | 'ate_120' | 'acima_120'
type CampoDeOrdem = 'nome' | 'preco' | 'estoque'
type Ordem = { campo: CampoDeOrdem; dir: 'asc' | 'desc' }

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'ativos', rotulo: 'Ativos' },
  { valor: 'inativos', rotulo: 'Inativos' },
]
const ESTOQUES: { valor: Estoque; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'com', rotulo: 'Com estoque' },
  { valor: 'esgotado', rotulo: 'Esgotados' },
]
// As faixas são as mesmas do orçamento que a pessoa escolhe na análise: produto
// acima do valor escolhido nunca entra na rotina dela.
const FAIXAS: { valor: Faixa; rotulo: string; fora: (centavos: number) => boolean }[] = [
  { valor: 'todos', rotulo: 'Todos', fora: () => false },
  { valor: 'ate_50', rotulo: 'Até R$ 50', fora: (c) => c > 5000 },
  { valor: 'ate_80', rotulo: 'Até R$ 80', fora: (c) => c > 8000 },
  { valor: 'ate_120', rotulo: 'Até R$ 120', fora: (c) => c > 12000 },
  { valor: 'acima_120', rotulo: 'Acima de R$ 120', fora: (c) => c <= 12000 },
]
const CAMPOS_DE_ORDEM: { campo: CampoDeOrdem; rotulo: string }[] = [
  { campo: 'nome', rotulo: 'Nome' },
  { campo: 'preco', rotulo: 'Preço' },
  { campo: 'estoque', rotulo: 'Estoque' },
]

/** Sem acento e sem maiúscula: "serum" acha "Sérum". */
function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function textoProdutos(n: number) {
  return n === 1 ? '1 produto' : `${n} produtos`
}

/* ------------------------------------------------------------------ */
/* Linha                                                               */
/* ------------------------------------------------------------------ */

const COLUNAS = 'md:grid md:grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_132px] md:gap-x-5'

function EstoqueTexto({ valor }: { valor: number }) {
  return valor === 0 ? (
    <span className="font-semibold text-terracota-escuro">Esgotado</span>
  ) : (
    <span className="tabular-nums">{valor} em estoque</span>
  )
}

function LinhaProduto({
  produto,
  ativo,
  alterando,
  aoAbrir,
  aoAlternar,
}: {
  produto: ProdutoVitrine
  ativo: boolean
  alterando: boolean
  aoAbrir: () => void
  aoAlternar: () => void
}) {
  return (
    <li
      className={cn(
        'group relative flex items-center gap-4 py-4 transition-colors hover:bg-nevoa/70 md:px-3',
        COLUNAS,
        'md:items-center',
      )}
    >
      <div className={cn('flex min-w-0 flex-1 items-center gap-4', !ativo && 'opacity-60')}>
        <ProdutoImagem produto={produto} className="size-16 md:size-14" tamanhos="64px" />
        <div className="min-w-0 flex-1">
          {/* O botão do nome cobre a linha toda (before:inset-0); o interruptor fica acima, com z-10. */}
          <button
            type="button"
            onClick={aoAbrir}
            className="line-clamp-2 max-w-full text-left text-[17px] leading-tight font-semibold outline-hidden before:absolute before:inset-0 before:rounded-2xl before:content-[''] focus-visible:before:outline-2 focus-visible:before:outline-petroleo"
          >
            {produto.nome}
          </button>
          <p className="mt-0.5 truncate text-[15px] text-tinta-suave">
            {produto.marca}
            <span className="ml-2.5 text-[13px] tabular-nums">{produto.codigo}</span>
          </p>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[15px] md:hidden">
            <span className="font-semibold tabular-nums">{reais(produto.precoCentavos)}</span>
            <EstoqueTexto valor={produto.estoque} />
          </p>
        </div>
      </div>

      <p className={cn('hidden text-[15px] md:block', !ativo && 'opacity-60')}>{ROTULO_CATEGORIA[produto.categoria]}</p>
      <p className={cn('hidden text-[16px] font-semibold tabular-nums md:block', !ativo && 'opacity-60')}>
        {reais(produto.precoCentavos)}
      </p>
      <p className={cn('hidden text-[15px] md:block', !ativo && 'opacity-60')}>
        <EstoqueTexto valor={produto.estoque} />
      </p>

      <div className="relative z-10 flex shrink-0 items-center justify-end gap-3">
        <span className="hidden w-14 text-right text-[15px] text-tinta-suave md:inline">{ativo ? 'Ativo' : 'Inativo'}</span>
        <Interruptor
          ligado={ativo}
          disabled={alterando}
          aoAlternar={aoAlternar}
          rotulo={`${produto.nome}: ${ativo ? 'ativo, toque para desativar' : 'inativo, toque para ativar'}`}
        />
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */

type Aviso = { tipo: 'ok' | 'erro'; texto: string }

export function CatalogoProdutos({ produtos }: { produtos: ProdutoVitrine[] }) {
  const router = useRouter()

  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')
  const [situacao, setSituacao] = useState<Situacao>('todos')
  const [estoque, setEstoque] = useState<Estoque>('todos')
  const [faixa, setFaixa] = useState<Faixa>('todos')
  const [ordem, setOrdem] = useState<Ordem>({ campo: 'nome', dir: 'asc' })
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)

  const [editor, setEditor] = useState<{ aberto: boolean; produto: ProdutoVitrine | null; versao: number }>({
    aberto: false,
    produto: null,
    versao: 0,
  })
  const [aviso, setAviso] = useState<Aviso | null>(null)
  // Troca de ativo/inativo na lista: aparece na hora e volta atrás se o servidor recusar.
  const [ativoLocal, setAtivoLocal] = useState<Record<string, boolean>>({})
  const [alterando, setAlterando] = useState<Record<string, boolean>>({})
  const campoBusca = useRef<HTMLInputElement>(null)

  // Depois do refresh, a lista que chega do servidor é a verdade.
  useEffect(() => {
    setAtivoLocal({})
  }, [produtos])

  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(null), 6000)
    return () => window.clearTimeout(id)
  }, [aviso])

  const estaAtivo = (p: ProdutoVitrine) => ativoLocal[p.id] ?? p.ativo

  const contagemPorCategoria = useMemo(() => {
    const mapa = new Map<Categoria, number>()
    for (const p of produtos) mapa.set(p.categoria, (mapa.get(p.categoria) ?? 0) + 1)
    return mapa
  }, [produtos])

  const filtrosAtivos = [situacao, estoque, faixa].filter((f) => f !== 'todos').length

  const visiveis = useMemo(() => {
    const termo = normalizar(busca.trim())
    const fora = FAIXAS.find((f) => f.valor === faixa)?.fora ?? (() => false)
    const lista = produtos.filter((p) => {
      const ativo = ativoLocal[p.id] ?? p.ativo
      if (categoria !== 'todas' && p.categoria !== categoria) return false
      if (situacao === 'ativos' && !ativo) return false
      if (situacao === 'inativos' && ativo) return false
      if (estoque === 'com' && p.estoque === 0) return false
      if (estoque === 'esgotado' && p.estoque > 0) return false
      if (fora(p.precoCentavos)) return false
      if (!termo) return true
      return normalizar([p.nome, p.marca, p.codigo, ...p.ativos].join(' ')).includes(termo)
    })
    const sinal = ordem.dir === 'asc' ? 1 : -1
    return lista.sort((a, b) => {
      if (ordem.campo === 'preco') return (a.precoCentavos - b.precoCentavos) * sinal || a.nome.localeCompare(b.nome, 'pt-BR')
      if (ordem.campo === 'estoque') return (a.estoque - b.estoque) * sinal || a.nome.localeCompare(b.nome, 'pt-BR')
      return a.nome.localeCompare(b.nome, 'pt-BR') * sinal
    })
  }, [produtos, ativoLocal, busca, categoria, situacao, estoque, faixa, ordem])

  const temFiltro = busca.trim() !== '' || categoria !== 'todas' || filtrosAtivos > 0

  function limparFiltros() {
    setBusca('')
    setCategoria('todas')
    setSituacao('todos')
    setEstoque('todos')
    setFaixa('todos')
  }

  function ordenarPor(campo: CampoDeOrdem) {
    setOrdem((o) => (o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' }))
  }

  function abrirEditor(produto: ProdutoVitrine | null) {
    setEditor((e) => ({ aberto: true, produto, versao: e.versao + 1 }))
  }

  function fecharEditor() {
    setEditor((e) => ({ ...e, aberto: false }))
  }

  function aoSalvar(texto: string) {
    fecharEditor()
    setAviso({ tipo: 'ok', texto })
    router.refresh()
  }

  async function alternarAtivo(produto: ProdutoVitrine) {
    if (alterando[produto.id]) return
    const novo = !estaAtivo(produto)
    setAlterando((a) => ({ ...a, [produto.id]: true }))
    setAtivoLocal((m) => ({ ...m, [produto.id]: novo }))

    const r = await atualizarProduto(produto.id, { ativo: novo })

    setAlterando((a) => ({ ...a, [produto.id]: false }))
    if (!r.ok) {
      setAtivoLocal((m) => {
        const { [produto.id]: _descartado, ...resto } = m
        return resto
      })
      setAviso({ tipo: 'erro', texto: r.erro })
      return
    }
    setAviso({ tipo: 'ok', texto: novo ? `${produto.nome} voltou para as rotinas.` : `${produto.nome} saiu das rotinas.` })
    router.refresh()
  }

  const ativosNoTotal = produtos.filter((p) => estaAtivo(p)).length

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[40px] leading-[1.02] font-bold tracking-[-0.03em] sm:text-[48px]">Produtos</h1>
          <p className="mt-2 max-w-[52ch] text-[16px] leading-snug text-tinta-suave">
            {textoProdutos(produtos.length)} no catálogo, {ativosNoTotal} ativos. A IA só indica o que está ativo e com
            estoque.
          </p>
        </div>
        <Botao
          tamanho="lg"
          className="w-full sm:w-auto"
          icone={<Plus className="size-5" aria-hidden />}
          onClick={() => abrirEditor(null)}
        >
          Novo produto
        </Botao>
      </header>

      <div aria-live="polite" className="mt-6 empty:mt-0">
        {aviso ? (
          <Alerta variante={aviso.tipo === 'ok' ? 'info' : 'erro'}>{aviso.texto}</Alerta>
        ) : null}
      </div>

      {/* Busca e filtros */}
      <div className="mt-6 flex gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden />
          <input
            ref={campoBusca}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            aria-label="Buscar produto por nome, marca, código ou ativo"
            placeholder="Buscar por nome, marca, código ou ativo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-12 w-full rounded-2xl border border-linha bg-white pr-12 pl-12 text-base outline-hidden transition placeholder:text-tinta-suave/85 hover:border-petroleo/40 focus:border-petroleo focus:ring-4 focus:ring-petroleo/15 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {busca ? (
            <button
              type="button"
              aria-label="Limpar a busca"
              onClick={() => {
                setBusca('')
                campoBusca.current?.focus()
              }}
              className="absolute top-1/2 right-0.5 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-tinta-suave transition hover:bg-menta hover:text-petroleo"
            >
              <X className="size-5" aria-hidden />
            </button>
          ) : null}
        </div>
        <Botao
          variante={filtrosAbertos || filtrosAtivos > 0 ? 'suave' : 'secundario'}
          icone={<SlidersHorizontal className="size-5" aria-hidden />}
          aria-expanded={filtrosAbertos}
          aria-controls="filtros-produtos"
          onClick={() => setFiltrosAbertos((a) => !a)}
        >
          Filtros
          {filtrosAtivos > 0 ? (
            <span className="grid size-6 place-items-center rounded-full bg-petroleo text-[13px] font-bold text-white">
              {filtrosAtivos}
            </span>
          ) : null}
        </Botao>
      </div>

      <div className="sem-barra -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Categoria">
        <Chip semSelo marcado={categoria === 'todas'} aoAlternar={() => setCategoria('todas')}>
          Todas
          <span className="text-[13px] text-tinta-suave tabular-nums">{produtos.length}</span>
        </Chip>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c}
            semSelo
            marcado={categoria === c}
            aoAlternar={() => setCategoria((atual) => (atual === c ? 'todas' : c))}
          >
            {ROTULO_CATEGORIA[c]}
            <span className="text-[13px] text-tinta-suave tabular-nums">{contagemPorCategoria.get(c) ?? 0}</span>
          </Chip>
        ))}
      </div>

      <div
        id="filtros-produtos"
        hidden={!filtrosAbertos}
        className="mt-4 grid gap-5 rounded-[22px] bg-nevoa p-5 md:grid-cols-3"
      >
        <FiltroEmChips
          rotulo="Situação"
          opcoes={SITUACOES}
          valor={situacao}
          aoMudar={setSituacao}
        />
        <FiltroEmChips rotulo="Estoque" opcoes={ESTOQUES} valor={estoque} aoMudar={setEstoque} />
        <FiltroEmChips rotulo="Preço" opcoes={FAIXAS} valor={faixa} aoMudar={setFaixa} />
      </div>

      {/* Resumo e ordem */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="text-[15px] text-tinta-suave">
          <span aria-live="polite">
            {visiveis.length === produtos.length
              ? textoProdutos(produtos.length)
              : `${visiveis.length} de ${textoProdutos(produtos.length)}`}
          </span>
          {temFiltro ? (
            <button
              type="button"
              onClick={limparFiltros}
              className="ml-2 inline-flex h-11 items-center rounded-full px-3 text-[15px] font-semibold text-petroleo transition hover:bg-menta"
            >
              Limpar filtros
            </button>
          ) : null}
        </p>
        <div role="group" aria-label="Ordenar por" className="flex items-center gap-1.5">
          <span className="mr-1 text-[15px] text-tinta-suave" aria-hidden>
            Ordenar
          </span>
          {CAMPOS_DE_ORDEM.map(({ campo, rotulo }) => {
            const ativo = ordem.campo === campo
            return (
              <button
                key={campo}
                type="button"
                aria-pressed={ativo}
                aria-label={
                  ativo
                    ? `Ordenar por ${rotulo.toLowerCase()}, ${ordem.dir === 'asc' ? 'crescente' : 'decrescente'}. Toque para inverter.`
                    : `Ordenar por ${rotulo.toLowerCase()}`
                }
                onClick={() => ordenarPor(campo)}
                className={cn(
                  'inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-colors',
                  ativo ? 'bg-menta text-petroleo' : 'text-tinta-suave hover:bg-nevoa hover:text-tinta',
                )}
              >
                {rotulo}
                {ativo ? (
                  ordem.dir === 'asc' ? <ArrowUp className="size-4" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      {produtos.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-petroleo/35 p-8 text-center">
          <p className="text-[22px] font-semibold">Nenhum produto cadastrado</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-[16px] leading-snug text-tinta-suave">
            Cadastre os produtos da farmácia para a IA poder montar as rotinas com o que existe na prateleira.
          </p>
          <Botao className="mt-6" icone={<Plus className="size-5" aria-hidden />} onClick={() => abrirEditor(null)}>
            Cadastrar o primeiro produto
          </Botao>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="mt-6 rounded-[24px] bg-nevoa p-8 text-center">
          <p className="text-[20px] font-semibold">Nenhum produto com esses filtros</p>
          <p className="mx-auto mt-2 max-w-[40ch] text-[16px] leading-snug text-tinta-suave">
            Troque a busca ou tire algum filtro para ver mais produtos.
          </p>
          <Botao variante="secundario" className="mt-5" onClick={limparFiltros}>
            Limpar filtros
          </Botao>
        </div>
      ) : (
        <div className="mt-2">
          <div
            aria-hidden
            className={cn(
              'hidden border-b border-linha px-3 pb-2.5 text-[14px] font-semibold text-tinta-suave',
              COLUNAS,
            )}
          >
            <span>Produto</span>
            <span>Categoria</span>
            <span>Preço</span>
            <span>Estoque</span>
            <span className="text-right">Situação</span>
          </div>
          <ul className="divide-y divide-linha">
            {visiveis.map((p) => (
              <LinhaProduto
                key={p.id}
                produto={p}
                ativo={estaAtivo(p)}
                alterando={Boolean(alterando[p.id])}
                aoAbrir={() => abrirEditor(p)}
                aoAlternar={() => void alternarAtivo(p)}
              />
            ))}
          </ul>
        </div>
      )}

      <EditorProduto
        aberto={editor.aberto}
        produto={editor.produto}
        versao={editor.versao}
        aoFechar={fecharEditor}
        aoSalvo={aoSalvar}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function FiltroEmChips<V extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string
  opcoes: { valor: V; rotulo: string }[]
  valor: V
  aoMudar: (valor: V) => void
}) {
  return (
    <div role="group" aria-label={rotulo}>
      <p className="mb-2.5 text-[15px] font-semibold" aria-hidden>
        {rotulo}
      </p>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <Chip key={o.valor} semSelo marcado={valor === o.valor} aoAlternar={() => aoMudar(o.valor)}>
            {o.rotulo}
          </Chip>
        ))}
      </div>
    </div>
  )
}
