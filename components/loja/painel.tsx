import { ChevronRight, ScanFace } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ProdutoImagem } from '@/components/produto/produto-imagem'
import { BarraMedida } from '@/components/ui/barra-medida'
import { BotaoLink } from '@/components/ui/botao'
import { cn } from '@/components/ui/cn'
import { dataHora } from '@/lib/formatar'
import { ROTULO_MEDIDA, ROTULO_TIPO_PELE, type AnaliseResumo, type MetricasLoja } from '@/lib/tipos'
import { GraficoDias } from './grafico-dias'

const DOLAR = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })
const INTEIRO = new Intl.NumberFormat('pt-BR')

function plural(n: number, singular: string, varios: string) {
  return `${INTEIRO.format(n)} ${n === 1 ? singular : varios}`
}

/* ------------------------------------------------------------------ */
/* Peças                                                               */
/* ------------------------------------------------------------------ */

function Secao({
  id,
  titulo,
  descricao,
  className,
  children,
}: {
  id: string
  titulo: string
  descricao?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="text-[24px] leading-tight font-semibold">
        {titulo}
      </h2>
      {descricao ? <p className="mt-1 text-[15px] leading-snug text-tinta-suave">{descricao}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-nevoa p-5 text-[16px] leading-snug text-tinta-suave">{children}</p>
}

/** Célula do quadro de números. O número usa a mesma fonte do texto, com algarismos proporcionais. */
function Indicador({
  rotulo,
  valor,
  apoio,
  grande = false,
  pequeno = false,
  className,
  children,
}: {
  rotulo: string
  valor: string
  apoio?: string
  grande?: boolean
  pequeno?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('flex flex-col bg-white p-5 sm:p-6', className)}>
      <p className="text-[15px] font-medium text-tinta-suave">{rotulo}</p>
      <p
        className={cn(
          'mt-3 font-sans leading-none font-semibold tracking-[-0.02em]',
          grande ? 'text-[64px]' : pequeno ? 'text-[28px] leading-[1.15]' : 'text-[38px]',
        )}
      >
        {valor}
      </p>
      {children}
      {apoio ? <p className="mt-3 text-[14px] leading-snug text-tinta-suave">{apoio}</p> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Seções                                                              */
/* ------------------------------------------------------------------ */

function TiposDePele({ tipos }: { tipos: MetricasLoja['tiposPele'] }) {
  const total = tipos.reduce((soma, t) => soma + t.total, 0)
  if (total === 0) return <Vazio>Ainda não há análises concluídas para mostrar a distribuição.</Vazio>

  const ordenados = [...tipos].sort((a, b) => b.total - a.total)
  return (
    <ul className="grid gap-5">
      {ordenados.map((t) => {
        const pct = Math.round((t.total / total) * 100)
        return (
          <li key={t.tipo}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[17px] font-semibold">{ROTULO_TIPO_PELE[t.tipo]}</p>
              <p className="text-[15px] text-tinta-suave">
                <span className="text-[17px] font-semibold text-tinta tabular-nums">{t.total}</span>
                <span className="ml-2 tabular-nums">{pct}%</span>
              </p>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-menta">
              <div className="h-full rounded-full bg-petroleo" style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function MediasDasMedidas({ medias, concluidas }: { medias: MetricasLoja['mediasMedidas']; concluidas: number }) {
  if (concluidas === 0) return <Vazio>As médias aparecem quando houver análises concluídas.</Vazio>
  return (
    <ul className="grid gap-5">
      {medias.map((m, i) => (
        <li key={m.chave}>
          <BarraMedida rotulo={ROTULO_MEDIDA[m.chave]} nota={m.media} atraso={i * 60} />
        </li>
      ))}
    </ul>
  )
}

function ProdutosMaisIndicados({ itens }: { itens: MetricasLoja['produtosMaisIndicados'] }) {
  if (itens.length === 0) return <Vazio>Nenhum produto foi indicado ainda.</Vazio>
  const maior = Math.max(1, ...itens.map((i) => i.vezes))
  return (
    <ol className="grid gap-5">
      {itens.map(({ produto, vezes }, i) => (
        <li key={produto.id} className="flex items-center gap-4">
          <span aria-hidden className="w-4 shrink-0 text-center font-titulo text-[18px] font-bold text-tinta-suave">
            {i + 1}
          </span>
          <ProdutoImagem produto={produto} className="size-14" tamanhos="56px" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] leading-tight font-semibold">{produto.nome}</p>
            <p className="truncate text-[14px] text-tinta-suave">{produto.marca}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-menta">
              <div className="h-full rounded-full bg-petroleo" style={{ width: `${(vezes / maior) * 100}%` }} />
            </div>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-[20px] leading-none font-semibold tabular-nums">{vezes}</span>
            <span className="mt-1 block text-[13px] text-tinta-suave">{vezes === 1 ? 'indicação' : 'indicações'}</span>
          </p>
        </li>
      ))}
    </ol>
  )
}

function textoDaPele(a: AnaliseResumo) {
  if (a.status === 'foto_recusada') return 'Foto não aproveitada'
  if (a.status === 'erro') return 'Análise não concluída'
  return a.tipoPele ? `Pele ${ROTULO_TIPO_PELE[a.tipoPele].toLowerCase()}` : 'Análise concluída'
}

function UltimasAnalises({ itens }: { itens: AnaliseResumo[] }) {
  if (itens.length === 0) {
    return <Vazio>Nenhuma análise ainda. Abra o modo totem e faça a primeira para ver os números aqui.</Vazio>
  }
  return (
    <div>
      <div
        aria-hidden
        className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_20px] gap-x-5 border-b border-linha pb-2.5 text-[14px] font-semibold text-tinta-suave md:grid"
      >
        <span>Cliente</span>
        <span>Resultado</span>
        <span>Destaque</span>
        <span>Quando</span>
        <span />
      </div>
      <ul className="divide-y divide-linha">
        {itens.map((a) => {
          const falhou = a.status !== 'concluida'
          return (
            <li key={a.id}>
              <Link
                href={`/app/analise/${a.id}`}
                className="group block py-4 transition-colors hover:bg-nevoa/60 md:grid md:min-h-[68px] md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_20px] md:items-center md:gap-x-5 md:px-0"
              >
                {/* Celular: duas linhas */}
                <div className="md:hidden">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[16px] font-semibold">{a.cliente?.nome ?? 'Cliente'}</p>
                    <time dateTime={a.criadoEm} className="shrink-0 text-[14px] text-tinta-suave">
                      {dataHora(a.criadoEm)}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-[15px]">
                    <span className={cn('font-semibold', falhou && 'text-terracota-escuro')}>{textoDaPele(a)}</span>
                    {a.destaque ? <span className="ml-2.5 text-tinta-suave">{a.destaque}</span> : null}
                  </p>
                </div>

                {/* Tela larga: colunas */}
                <div className="hidden min-w-0 md:block">
                  <p className="truncate text-[16px] font-semibold">{a.cliente?.nome ?? 'Cliente'}</p>
                  <p className="truncate text-[14px] text-tinta-suave">{a.cliente?.email}</p>
                </div>
                <p className={cn('hidden text-[16px] font-semibold md:block', falhou && 'text-terracota-escuro')}>
                  {textoDaPele(a)}
                </p>
                <p className="hidden truncate text-[15px] text-tinta-suave md:block">{a.destaque ?? ''}</p>
                <time dateTime={a.criadoEm} className="hidden text-[15px] text-tinta-suave md:block">
                  {dataHora(a.criadoEm)}
                </time>
                <ChevronRight
                  aria-hidden
                  className="hidden size-5 text-tinta-suave transition group-hover:translate-x-0.5 group-hover:text-petroleo md:block"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Painel                                                              */
/* ------------------------------------------------------------------ */

export function PainelLoja({ metricas, nomeDaLoja }: { metricas: MetricasLoja; nomeDaLoja: string }) {
  const { acertou, errou } = metricas.avaliacoes
  const avaliadas = acertou + errou
  const taxa = avaliadas > 0 ? Math.round((acertou / avaliadas) * 100) : null
  const concluidas = metricas.tiposPele.reduce((soma, t) => soma + t.total, 0)

  return (
    <div>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-[16px] text-tinta-suave">{nomeDaLoja}</p>
          <h1 className="mt-1 text-[40px] leading-[1.02] font-bold tracking-[-0.03em] sm:text-[48px]">Painel da loja</h1>
        </div>
        <BotaoLink
          href="/app/analise/nova"
          tamanho="lg"
          icone={<ScanFace className="size-5" aria-hidden />}
          className="w-full sm:w-auto"
        >
          Abrir modo totem
        </BotaoLink>
      </header>

      {/* Quadro de números: uma peça só, com fios finos entre as células */}
      <section
        aria-label="Resumo das análises"
        className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-[26px] border border-linha bg-linha md:grid-cols-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]"
      >
        <Indicador
          rotulo="Análises hoje"
          valor={INTEIRO.format(metricas.analisesHoje)}
          grande
          className="col-span-2 md:col-span-2 xl:col-span-1"
        />
        <Indicador rotulo="Últimos 7 dias" valor={INTEIRO.format(metricas.analises7Dias)} />
        <Indicador
          rotulo="Total de análises"
          valor={INTEIRO.format(metricas.analisesTotal)}
          apoio={
            metricas.fotosRecusadas > 0 ? `${plural(metricas.fotosRecusadas, 'foto recusada', 'fotos recusadas')}` : undefined
          }
        />
        <Indicador
          rotulo="Taxa de acerto"
          valor={taxa === null ? 'Sem dados' : `${taxa}%`}
          pequeno={taxa === null}
          apoio={
            taxa === null
              ? 'Ninguém avaliou o resultado ainda.'
              : `${plural(acertou, 'acerto', 'acertos')} e ${plural(errou, 'erro', 'erros')}`
          }
          className="col-span-2 xl:col-span-1"
        >
          {taxa !== null ? (
            <div
              role="meter"
              aria-label="Taxa de acerto"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={taxa}
              className="mt-3 h-2 overflow-hidden rounded-full bg-menta"
            >
              <div className="h-full rounded-full bg-petroleo" style={{ width: `${taxa}%` }} />
            </div>
          ) : null}
        </Indicador>
        <Indicador
          rotulo="Custo estimado da IA"
          valor={DOLAR.format(metricas.custoIaDolares)}
          apoio="Estimativa das chamadas à IA, somando todas as análises."
          className="col-span-2 xl:col-span-1"
        />
      </section>

      <div className="mt-14 grid gap-x-14 gap-y-14 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Secao id="titulo-dias" titulo="Análises por dia" descricao="O movimento dos últimos 14 dias.">
          <GraficoDias dados={metricas.porDia} />
        </Secao>
        <Secao id="titulo-tipos" titulo="Tipos de pele" descricao="Nas análises concluídas.">
          <TiposDePele tipos={metricas.tiposPele} />
        </Secao>
      </div>

      <div className="mt-14 grid gap-x-14 gap-y-14 xl:grid-cols-2">
        <Secao
          id="titulo-medias"
          titulo="Média das características"
          descricao="De 0 a 100, nas análises concluídas. Quanto mais alta, mais a característica aparece."
        >
          <MediasDasMedidas medias={metricas.mediasMedidas} concluidas={concluidas} />
        </Secao>
        <Secao id="titulo-produtos" titulo="Produtos mais indicados" descricao="Os cinco que mais entraram nas rotinas.">
          <ProdutosMaisIndicados itens={metricas.produtosMaisIndicados} />
        </Secao>
      </div>

      <Secao id="titulo-ultimas" titulo="Últimas análises" descricao="Abra uma linha para ver o resultado completo." className="mt-14">
        <UltimasAnalises itens={metricas.ultimas} />
      </Secao>
    </div>
  )
}
