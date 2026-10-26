import { ChevronRight, ScanFace, Store } from 'lucide-react'
import Link from 'next/link'
import { ContornoOval } from '@/components/marca/contorno'
import { BotaoLink } from '@/components/ui/botao'
import { dataExtenso, dataHora, primeiroNome } from '@/lib/formatar'
import { ROTULO_TIPO_PELE, type AnaliseResumo, type SessaoPublica } from '@/lib/tipos'
import { AvisoLegal } from './aviso-legal'
import { SeusDados } from './seus-dados'

const PASSOS = [
  'Responda seis perguntas rápidas sobre a sua pele.',
  'Tire uma foto do rosto. Ela é apagada assim que o resultado sai.',
  'Receba uma rotina de manhã e de noite com produtos que a farmácia tem em estoque.',
]

function textoDoStatus(a: AnaliseResumo) {
  if (a.status === 'foto_recusada') return 'Foto não aproveitada'
  if (a.status === 'erro') return 'Análise não concluída'
  return null
}

function UltimaAnalise({ analise }: { analise: AnaliseResumo }) {
  return (
    <section className="mt-8 px-5" aria-labelledby="titulo-ultima">
      <h2 id="titulo-ultima" className="text-[22px] leading-tight font-semibold">
        Sua última análise
      </h2>
      <Link
        href={`/app/analise/${analise.id}`}
        className="group mt-3.5 flex items-center gap-4 rounded-[22px] border border-linha bg-nevoa p-5 transition duration-200 hover:border-petroleo/40"
      >
        <div className="min-w-0 flex-1">
          <time dateTime={analise.criadoEm} className="text-[15px] text-tinta-suave">
            {dataExtenso(analise.criadoEm)}
          </time>
          <p className="mt-1 font-titulo text-[30px] leading-none font-bold tracking-[-0.025em]">
            {analise.tipoPele ? `Pele ${ROTULO_TIPO_PELE[analise.tipoPele].toLowerCase()}` : 'Análise concluída'}
          </p>
          {analise.destaque ? <p className="mt-2.5 text-[16px] leading-snug">{analise.destaque}</p> : null}
          <p className="mt-0.5 text-[15px] text-tinta-suave">
            {analise.totalProdutos === 1 ? '1 produto na rotina' : `${analise.totalProdutos} produtos na rotina`}
          </p>
        </div>
        <ChevronRight
          className="size-6 shrink-0 text-petroleo transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </section>
  )
}

function Historico({ analises, titulo }: { analises: AnaliseResumo[]; titulo: string }) {
  return (
    <section className="mt-8 px-5" aria-labelledby="titulo-historico">
      <h2 id="titulo-historico" className="text-[22px] leading-tight font-semibold">
        {titulo}
      </h2>
      <ul className="mt-2 divide-y divide-linha">
        {analises.map((a) => {
          const status = textoDoStatus(a)
          return (
            <li key={a.id}>
              <Link
                href={`/app/analise/${a.id}`}
                className="group flex min-h-[68px] items-center gap-4 py-3 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] leading-tight font-semibold">
                    {status ? (
                      <span className="text-terracota-escuro">{status}</span>
                    ) : a.tipoPele ? (
                      `Pele ${ROTULO_TIPO_PELE[a.tipoPele].toLowerCase()}`
                    ) : (
                      'Análise concluída'
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[15px] text-tinta-suave">
                    <time dateTime={a.criadoEm}>{dataHora(a.criadoEm)}</time>
                    {a.destaque ? <span className="ml-2.5">{a.destaque}</span> : null}
                  </p>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-tinta-suave transition group-hover:translate-x-0.5 group-hover:text-petroleo"
                  aria-hidden
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function PrimeiraAnalise() {
  return (
    <section className="mx-5 mt-8 rounded-[26px] border border-dashed border-petroleo/35 p-6" aria-labelledby="titulo-vazio">
      <h2 id="titulo-vazio" className="text-[24px] leading-[1.1] font-semibold">
        Sua primeira análise começa aqui
      </h2>
      <ol className="mt-5 grid gap-4">
        {PASSOS.map((texto, i) => (
          <li key={texto} className="flex items-start gap-4">
            <span
              aria-hidden
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-menta font-titulo text-[16px] font-bold text-petroleo"
            >
              {i + 1}
            </span>
            <p className="text-[16px] leading-snug text-tinta">{texto}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Inicio({ sessao, analises }: { sessao: SessaoPublica; analises: AnaliseResumo[] }) {
  const ehLoja = sessao.papel === 'loja'
  const ultimaConcluida = analises.find((a) => a.status === 'concluida')
  const restante = analises.filter((a) => a !== ultimaConcluida)

  return (
    <div className="flex flex-1 flex-col pb-10">
      <section className="px-5 pt-1">
        <p className="text-[15px] text-tinta-suave">Entenda sua pele. Escolha melhor.</p>
        {ehLoja ? (
          <>
            <h1 className="mt-1 text-[38px] leading-[1.02] font-bold tracking-[-0.03em]">Modo totem</h1>
            <p className="mt-2 text-[16px] text-tinta-suave">Conta da loja: {sessao.nome}</p>
            <p className="mt-1 text-[15px] leading-snug text-tinta-suave">
              Os resultados de quem usou antes ficam só no painel da loja.
            </p>
          </>
        ) : (
          <h1 className="mt-1 text-[38px] leading-[1.02] font-bold tracking-[-0.03em]">Olá, {primeiroNome(sessao.nome)}</h1>
        )}
      </section>

      {ehLoja ? (
        <Link
          href="/loja"
          className="mx-5 mt-5 flex min-h-14 items-center gap-3 rounded-2xl bg-menta px-4 text-petroleo transition duration-200 hover:bg-[#d5e9e5]"
        >
          <Store className="size-5 shrink-0" aria-hidden />
          <span className="flex-1 text-[16px] font-semibold">Abrir painel da loja</span>
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </Link>
      ) : null}

      <section className="relative mx-5 mt-6 overflow-hidden rounded-[28px] bg-rosado p-6">
        <ContornoOval
          className="pointer-events-none absolute -top-7 -right-12 h-[260px] w-[195px] text-petroleo/25"
          passos={40}
          espessura={5.5}
          animado
        />
        <h2 className="relative max-w-[13ch] text-[28px] leading-[1.05] font-bold">Descubra o que sua pele precisa hoje</h2>
        <p className="relative mt-3 max-w-[28ch] text-[16px] leading-snug text-tinta-suave">
          Seis perguntas rápidas, uma foto do rosto e sua rotina de manhã e de noite.
        </p>
        <BotaoLink
          href="/app/analise/nova"
          tamanho="lg"
          cheio
          className="relative mt-6"
          icone={<ScanFace className="size-5" aria-hidden />}
        >
          Fazer nova análise
        </BotaoLink>
      </section>

      {analises.length === 0 ? <PrimeiraAnalise /> : null}
      {ultimaConcluida ? <UltimaAnalise analise={ultimaConcluida} /> : null}
      {restante.length > 0 ? (
        <Historico analises={restante} titulo={ehLoja ? 'Análises feitas neste totem' : 'Análises anteriores'} />
      ) : null}

      {ehLoja ? null : <SeusDados temAnalises={analises.length > 0} className="mt-10 px-5" />}

      <AvisoLegal className="mt-10 px-5" />
    </div>
  )
}
