'use client'

import { useId, useState } from 'react'
import { cn } from '@/components/ui/cn'
import { Segmentado } from '@/components/ui/segmentado'

type Dia = { data: string; total: number }

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "2026-10-26" vira { dia: "26", mes: "out" }. Sem Date: o dia já vem no fuso de São Paulo. */
function partesDaData(data: string) {
  const [, mes = '1', dia = '1'] = data.split('-')
  return { dia: String(Number(dia)), mes: MESES[Number(mes) - 1] ?? '' }
}

function rotuloDaData(data: string) {
  const { dia, mes } = partesDaData(data)
  return `${dia} de ${mes}`
}

function textoAnalises(n: number) {
  return n === 1 ? '1 análise' : `${n} análises`
}

/** Teto "redondo" e par, para o meio do eixo ser um inteiro (2, 4, 6, 8, 10, 20, 40...). */
function tetoDoEixo(maximo: number) {
  if (maximo <= 2) return 2
  const base = 10 ** Math.floor(Math.log10(maximo))
  for (const m of [1, 2, 4, 6, 8, 10]) {
    if (m * base >= maximo && (m * base) % 2 === 0) return m * base
  }
  return 10 * base
}

const ALTURA = 208

/**
 * Colunas de análises por dia. Uma série só, então uma cor só e sem legenda: o
 * título já diz o que é. Passar o mouse (ou focar com o teclado) mostra o valor
 * do dia; só o maior dia e o dia de hoje levam número na coluna. Há uma visão
 * em tabela com os mesmos valores.
 */
export function GraficoDias({ dados }: { dados: Dia[] }) {
  const idTabela = useId()
  const [modo, setModo] = useState<'grafico' | 'tabela'>('grafico')
  const [ativo, setAtivo] = useState<number | null>(null)

  const total = dados.reduce((soma, d) => soma + d.total, 0)
  const maiorValor = Math.max(0, ...dados.map((d) => d.total))
  const teto = tetoDoEixo(maiorValor)
  const indiceDoMaior = maiorValor > 0 ? dados.findIndex((d) => d.total === maiorValor) : -1
  const ultimo = dados.length - 1
  const diaAtivo = ativo !== null ? dados[ativo] : undefined

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-tinta-suave">
          {total === 0 ? 'Nenhuma análise nos últimos 14 dias' : `${textoAnalises(total)} nos últimos 14 dias`}
        </p>
        <Segmentado
          rotuloAcessivel="Forma de ver os dados"
          valor={modo}
          aoMudar={setModo}
          className="w-[210px]"
          itens={[
            { valor: 'grafico', rotulo: 'Gráfico' },
            { valor: 'tabela', rotulo: 'Tabela' },
          ]}
        />
      </div>

      {modo === 'grafico' ? (
        <div className="mt-6">
          <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-2.5">
            {/* Eixo vertical */}
            <div className="relative" style={{ height: ALTURA }} aria-hidden>
              {[teto, teto / 2, 0].map((valor, i) => (
                <span
                  key={valor}
                  className="absolute right-0 -translate-y-1/2 text-[12px] leading-none text-tinta-suave tabular-nums"
                  style={{ top: `${i * 50}%` }}
                >
                  {valor}
                </span>
              ))}
            </div>

            <div className="relative" style={{ height: ALTURA }}>
              {/* Linhas de grade: hairline sólida, um tom acima do fundo */}
              {[0, 50, 100].map((topo) => (
                <div
                  key={topo}
                  aria-hidden
                  className={cn('absolute inset-x-0 h-px', topo === 100 ? 'bg-linha' : 'bg-linha/60')}
                  style={{ top: `${topo}%` }}
                />
              ))}

              <div className="absolute inset-0 grid auto-cols-fr grid-flow-col gap-0.5">
                {dados.map((d, i) => {
                  const altura = (d.total / teto) * 100
                  const rotulado = i === indiceDoMaior || i === ultimo
                  return (
                    <button
                      key={d.data}
                      type="button"
                      aria-label={`${rotuloDaData(d.data)}${i === ultimo ? ' (hoje)' : ''}: ${textoAnalises(d.total)}`}
                      onPointerEnter={() => setAtivo(i)}
                      onPointerLeave={() => setAtivo(null)}
                      onFocus={() => setAtivo(i)}
                      onBlur={() => setAtivo(null)}
                      className="relative flex h-full items-end justify-center outline-hidden focus-visible:bg-menta/60"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'w-full max-w-6 rounded-t-[4px] bg-petroleo transition-opacity duration-150',
                          ativo !== null && ativo !== i && 'opacity-40',
                        )}
                        style={{ height: `${altura}%`, minHeight: d.total > 0 ? 3 : 0 }}
                      />
                      {rotulado && d.total > 0 ? (
                        <span
                          aria-hidden
                          className="absolute left-1/2 -translate-x-1/2 text-[12px] leading-none font-semibold text-tinta tabular-nums"
                          style={{ bottom: `calc(${altura}% + 6px)` }}
                        >
                          {d.total}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {ativo !== null && diaAtivo ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute z-10 w-max -translate-x-1/2 rounded-xl bg-tinta px-3 py-2 text-white shadow-flutuante"
                  style={{
                    top: 8,
                    left: `clamp(52px, ${((ativo + 0.5) / dados.length) * 100}%, calc(100% - 52px))`,
                  }}
                >
                  <p className="text-[16px] leading-none font-semibold">{textoAnalises(diaAtivo.total)}</p>
                  <p className="mt-1 text-[12px] leading-none text-white/75">{rotuloDaData(diaAtivo.data)}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Eixo horizontal: o dia, e o mês no primeiro e no dia 1 */}
          <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-2.5" aria-hidden>
            <span />
            <div className="mt-2 grid auto-cols-fr grid-flow-col gap-0.5 text-center text-[12px] leading-tight text-tinta-suave">
              {dados.map((d, i) => {
                const { dia, mes } = partesDaData(d.data)
                return (
                  <span key={d.data} className={cn('tabular-nums', i === ultimo && 'font-bold text-tinta')}>
                    {dia}
                    {i === 0 || dia === '1' ? <span className="block text-[11px] font-normal">{mes}</span> : null}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div
          role="region"
          aria-labelledby={idTabela}
          tabIndex={0}
          className="mt-5 max-h-[300px] overflow-y-auto rounded-2xl border border-linha"
        >
          <table className="w-full text-left text-[15px]">
            <caption id={idTabela} className="sr-only">
              Análises por dia nos últimos 14 dias
            </caption>
            <thead className="sticky top-0 bg-nevoa text-[14px] text-tinta-suave">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Dia
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                  Análises
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {[...dados].reverse().map((d, i) => (
                <tr key={d.data}>
                  <th scope="row" className="px-4 py-2.5 font-medium">
                    {rotuloDaData(d.data)}
                    {i === 0 ? <span className="ml-2 text-[13px] font-normal text-tinta-suave">hoje</span> : null}
                  </th>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
