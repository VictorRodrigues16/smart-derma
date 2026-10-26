import { ArrowLeft, Info, ScanFace, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { AvisoLegal } from '@/components/cliente/aviso-legal'
import { ContornoOval } from '@/components/marca/contorno'
import { Alerta } from '@/components/ui/alerta'
import { BarraMedida } from '@/components/ui/barra-medida'
import { BotaoLink } from '@/components/ui/botao'
import { dataExtenso, reais } from '@/lib/formatar'
import { ROTULO_MEDIDA, ROTULO_TIPO_PELE, type AnaliseCompleta } from '@/lib/tipos'
import { Avaliacao } from './avaliacao'
import { RotinaAbas } from './rotina-abas'

type Props = {
  analise: AnaliseCompleta
  /** A loja abriu pelo painel para conferir o resultado de alguém: sem avaliação e com volta para o painel. */
  doPainel: boolean
}

function Voltar({ doPainel }: { doPainel: boolean }) {
  return (
    <Link
      href={doPainel ? '/loja' : '/app'}
      className="-ml-3 inline-flex h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold text-petroleo transition hover:bg-menta"
    >
      <ArrowLeft className="size-5" aria-hidden />
      {doPainel ? 'Painel da loja' : 'Início'}
    </Link>
  )
}

/** Os dois botões do fim da tela. Quem veio do painel volta para o painel; os outros fazem outra análise. */
function Acoes({ doPainel }: { doPainel: boolean }) {
  return doPainel ? (
    <>
      <BotaoLink href="/loja" tamanho="lg" cheio>
        Voltar ao painel
      </BotaoLink>
      <BotaoLink href="/app/analise/nova" variante="secundario" cheio icone={<ScanFace className="size-5" aria-hidden />}>
        Fazer nova análise no totem
      </BotaoLink>
    </>
  ) : (
    <>
      <BotaoLink href="/app/analise/nova" tamanho="lg" cheio icone={<ScanFace className="size-5" aria-hidden />}>
        Fazer nova análise
      </BotaoLink>
      <BotaoLink href="/app" variante="secundario" cheio>
        Voltar ao início
      </BotaoLink>
    </>
  )
}

function Pontos({ itens }: { itens: string[] }) {
  return (
    <ul className="grid gap-3">
      {itens.map((texto) => (
        <li key={texto} className="flex gap-3 text-[16px] leading-snug">
          <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-terracota-escuro" />
          <span>{texto}</span>
        </li>
      ))}
    </ul>
  )
}

/** Foto recusada ou erro: mensagem calma e o caminho para tentar de novo. */
function SemResultado({ analise, doPainel }: Props) {
  const recusada = analise.status === 'foto_recusada'
  return (
    <div className="flex flex-1 flex-col px-5 pb-10">
      <Voltar doPainel={doPainel} />
      <section className="mt-4 rounded-[28px] bg-rosado p-6">
        <time dateTime={analise.criadoEm} className="text-[15px] text-tinta-suave">
          {dataExtenso(analise.criadoEm)}
        </time>
        <h1 className="mt-2 text-[32px] leading-[1.05] font-bold">
          {recusada ? 'Não conseguimos analisar a foto' : 'A análise não foi concluída'}
        </h1>
        {analise.motivoRecusa ? (
          <p className="mt-3 text-[17px] leading-relaxed">{analise.motivoRecusa}</p>
        ) : (
          <p className="mt-3 text-[17px] leading-relaxed">
            {recusada ? 'A foto não serviu para a análise.' : 'Algo deu errado do nosso lado. Tente de novo em instantes.'}
          </p>
        )}
        {analise.orientacaoFoto ? (
          <p className="mt-3 flex items-start gap-2.5 text-[16px] leading-snug text-tinta-suave">
            <Info className="mt-0.5 size-5 shrink-0 text-terracota-escuro" aria-hidden />
            <span>{analise.orientacaoFoto}</span>
          </p>
        ) : null}
      </section>
      <div className="mt-6 grid gap-3">
        <Acoes doPainel={doPainel} />
      </div>
      <AvisoLegal className="mt-10" />
    </div>
  )
}

export function Resultado({ analise, doPainel }: Props) {
  if (analise.status !== 'concluida' || !analise.tipoPele) {
    return <SemResultado analise={analise} doPainel={doPainel} />
  }

  const tipo = ROTULO_TIPO_PELE[analise.tipoPele].toLowerCase()
  const totalProdutos = analise.produtos.length
  const temPontos = analise.pontosDeAtencao.length > 0

  return (
    <div className="flex flex-1 flex-col pb-12">
      <div className="px-5">
        <Voltar doPainel={doPainel} />
      </div>

      <section className="relative isolate mx-4 mt-2 overflow-hidden rounded-[30px] bg-petroleo px-6 pt-7 pb-9 text-white">
        <ContornoOval
          className="pointer-events-none absolute -right-16 -bottom-14 -z-10 h-[340px] w-[255px] text-white/15"
          passos={44}
          espessura={5}
        />
        <time dateTime={analise.criadoEm} className="text-[15px] text-white/75">
          {dataExtenso(analise.criadoEm)}
          {analise.cliente ? ` · ${analise.cliente.nome}` : null}
        </time>
        <h1 className="mt-3 text-[56px] leading-[0.96] font-bold tracking-[-0.035em]">Pele {tipo}</h1>
        {analise.resumo ? (
          <p className="mt-5 max-w-[36ch] text-[17px] leading-relaxed text-white/90">{analise.resumo}</p>
        ) : null}
      </section>

      <section className="px-5 pt-10" aria-labelledby="titulo-medidas">
        <h2 id="titulo-medidas" className="text-[26px] leading-tight font-semibold">
          O que vimos na sua pele
        </h2>
        <p className="mt-1.5 text-[15px] leading-snug text-tinta-suave">
          Notas de 0 a 100: quanto mais alta, mais a característica aparece.
        </p>
        <ul className="mt-6 divide-y divide-linha">
          {analise.medidas.map((m, i) => (
            <li key={m.chave} className="py-5 first:pt-0 last:pb-0">
              <BarraMedida
                rotulo={ROTULO_MEDIDA[m.chave]}
                nota={m.nota}
                nivel={m.nivel}
                observacao={m.observacao}
                confianca={m.confianca}
                atraso={i * 70}
              />
            </li>
          ))}
        </ul>
      </section>

      {analise.sugerirDermatologista ? (
        <section
          className="mx-5 mt-10 rounded-[24px] border border-pele bg-rosado p-6"
          aria-labelledby="titulo-dermatologista"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-terracota-escuro">
              <Stethoscope className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="titulo-dermatologista" className="text-[22px] leading-tight font-semibold">
                Vale conversar com um dermatologista
              </h2>
              <p className="mt-2 text-[16px] leading-relaxed">
                O que vimos na sua pele pede uma avaliação profissional. A rotina abaixo ajuda no cuidado do dia a dia,
                mas não substitui a consulta.
              </p>
            </div>
          </div>
          {temPontos ? (
            <div className="mt-5 border-t border-pele pt-5">
              <Pontos itens={analise.pontosDeAtencao} />
            </div>
          ) : null}
        </section>
      ) : temPontos ? (
        <section className="mx-5 mt-10 rounded-[24px] bg-nevoa p-6" aria-labelledby="titulo-atencao">
          <h2 id="titulo-atencao" className="text-[22px] leading-tight font-semibold">
            Pontos de atenção
          </h2>
          <div className="mt-4">
            <Pontos itens={analise.pontosDeAtencao} />
          </div>
        </section>
      ) : null}

      <section className="px-5 pt-10" aria-labelledby="titulo-rotina">
        <h2 id="titulo-rotina" className="text-[26px] leading-tight font-semibold">
          Sua rotina
        </h2>
        <p className="mt-1.5 text-[15px] leading-snug text-tinta-suave">
          Só produtos que a farmácia tinha em estoque na hora da análise.
        </p>

        {totalProdutos > 0 ? (
          <>
            <RotinaAbas manha={analise.rotina.manha} noite={analise.rotina.noite} />
            <div className="mt-9 flex items-center justify-between gap-4 rounded-[22px] bg-rosado p-5">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">Total da rotina</p>
                <p className="mt-0.5 text-[14px] leading-snug text-tinta-suave">
                  {totalProdutos === 1 ? '1 produto' : `${totalProdutos} produtos`}, cada um conta uma vez
                </p>
              </div>
              <p className="shrink-0 font-sans text-[30px] leading-none font-bold">{reais(analise.totalCentavos)}</p>
            </div>
          </>
        ) : (
          <Alerta variante="aviso" className="mt-5">
            Nenhum produto coube nas suas respostas e no estoque de agora. Peça uma indicação no balcão da farmácia.
          </Alerta>
        )}

        <AvisoLegal className="mt-6" />
      </section>

      {analise.podeAvaliar ? (
        <Avaliacao analiseId={analise.id} avaliacao={analise.avaliacao} comentario={analise.comentarioAvaliacao} />
      ) : null}

      <div className="mt-8 grid gap-3 px-5">
        <Acoes doPainel={doPainel} />
      </div>
    </div>
  )
}
