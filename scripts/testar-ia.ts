/**
 * Testa a IA de ponta a ponta, sem subir o site: catálogo real do banco,
 * mesma função que a rota usa (lib/ia/analisar.ts), foto limpa pelo mesmo
 * sharp. Nada é gravado no banco.
 *
 *   pnpm ia:testar caminho/da/foto.jpg
 *   pnpm ia:testar https://endereco/da/foto.jpg      (a Anthropic busca a URL)
 *   pnpm ia:testar foto.jpg --perfil=seca            (troca as respostas)
 *
 * Use para conferir o "treino" depois de mexer em lib/ia/prompt.ts.
 */
import './ambiente'
import { readFile } from 'node:fs/promises'
import { prisma } from '../lib/prisma'
import { analisarPele, type FotoParaIA } from '../lib/ia/analisar'
import { paraVitrine } from '../lib/vitrine'
import { prepararFotoParaIA } from '../lib/servidor/foto'
import { ROTULO_CATEGORIA, ROTULO_MEDIDA, ROTULO_NIVEL, type Respostas } from '../lib/tipos'

const PERFIS: Record<string, Respostas> = {
  mista: {
    tipoPercebido: 'mista',
    incomodos: ['acne', 'oleosidade'],
    sensivel: 'nao',
    gestante: 'nao',
    faixaEtaria: '18_24',
    orcamento: 'ate_80',
  },
  seca: {
    tipoPercebido: 'seca',
    incomodos: ['ressecamento', 'vermelhidao'],
    sensivel: 'sim',
    gestante: 'nao',
    faixaEtaria: '25_34',
    orcamento: 'ate_120',
  },
  gestante: {
    tipoPercebido: 'nao_sei',
    incomodos: ['manchas', 'linhas'],
    sensivel: 'nao_sei',
    gestante: 'sim',
    faixaEtaria: '25_34',
    orcamento: 'sem_limite',
  },
}

async function main() {
  const alvo = process.argv[2]
  if (!alvo) throw new Error('Diga a foto: pnpm ia:testar caminho/da/foto.jpg')
  const perfil = process.argv.find((a) => a.startsWith('--perfil='))?.split('=')[1] ?? 'mista'
  const respostas = PERFIS[perfil]
  if (!respostas) throw new Error(`Perfil desconhecido. Use: ${Object.keys(PERFIS).join(', ')}`)

  const foto: FotoParaIA = /^https?:\/\//.test(alvo)
    ? { tipo: 'url', url: alvo }
    : { tipo: 'base64', jpeg: (await prepararFotoParaIA(await readFile(alvo))).base64 }

  const catalogo = (await prisma.produto.findMany({ where: { ativo: true } })).map(paraVitrine)
  console.log(`Foto: ${alvo}\nPerfil: ${perfil}\nCatálogo ativo: ${catalogo.length} produtos\nAnalisando...\n`)

  const r = await analisarPele({ foto, respostas, catalogo })

  if (r.uso) {
    const u = r.uso
    const custo = (u.tokensEntrada * 4 + u.tokensSaida * 20 + u.tokensCacheLidos * 0.2) / 1_000_000
    console.log(
      `Modelo ${u.modelo} | ${(u.duracaoMs / 1000).toFixed(1)} s | entrada ${u.tokensEntrada} | cache lido ${u.tokensCacheLidos} | saída ${u.tokensSaida} | ~US$ ${custo.toFixed(4)}\n`,
    )
  }

  if (r.tipo === 'erro') {
    console.log(`ERRO: ${r.mensagem}\nDetalhe: ${r.detalhe}`)
    return
  }
  if (r.tipo === 'foto_recusada') {
    console.log(`FOTO RECUSADA (${r.problema}): ${r.motivo}\nOrientação: ${r.orientacao}`)
    return
  }

  console.log(`Tipo de pele: ${r.tipoPele}\nResumo: ${r.resumo}\n`)
  for (const m of r.medidas) {
    console.log(`  ${ROTULO_MEDIDA[m.chave].padEnd(16)} ${String(m.nota).padStart(3)}  ${ROTULO_NIVEL[m.nivel].padEnd(9)} (${m.confianca})  ${m.observacao}`)
  }
  if (r.pontosDeAtencao.length) console.log(`\nAtenção${r.sugerirDermatologista ? ' (sugerir dermatologista)' : ''}:\n- ${r.pontosDeAtencao.join('\n- ')}`)
  console.log('\nRotina:')
  for (const i of r.itens) {
    console.log(`  ${i.ordem}. [${i.turno}] ${ROTULO_CATEGORIA[i.produto.categoria]}: ${i.produto.codigo} ${i.produto.nome}\n     ${i.motivo}`)
  }
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
