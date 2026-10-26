import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { CHAVES_MEDIDA, nivelDaNota, type Medida, type ProdutoVitrine, type Respostas, type TipoPele } from '@/lib/tipos'
import { ROTULO_PROBLEMA_FOTO, SaidaIASchema, type ProblemaFoto, type SaidaIA } from './esquema'
import { montarMensagem, montarSistema } from './prompt'
import { filtrarElegiveis, montarRotina, type ItemFinal } from './rotina'

/**
 * Uma chamada ao Claude por análise: foto + respostas + catálogo entram,
 * medidas + rotina saem, no formato do esquema (structured outputs).
 *
 * Este módulo não importa nada do Next (cookies, headers): roda igual na
 * rota da API e no script `pnpm ia:testar`.
 */

export const MODELO_PADRAO = 'claude-opus-5-5'

export type UsoIA = {
  modelo: string
  tokensEntrada: number
  tokensSaida: number
  tokensCacheLidos: number
  duracaoMs: number
}

export type ResultadoIA =
  | { tipo: 'foto_recusada'; problema: ProblemaFoto; motivo: string; orientacao: string; uso: UsoIA }
  | {
      tipo: 'concluida'
      tipoPele: TipoPele
      resumo: string
      medidas: Medida[]
      pontosDeAtencao: string[]
      sugerirDermatologista: boolean
      itens: ItemFinal[]
      uso: UsoIA
    }
  | { tipo: 'erro'; mensagem: string; detalhe: string; uso: UsoIA | null }

let cliente: Anthropic | null = null
function obterCliente() {
  // Lê ANTHROPIC_API_KEY do ambiente. A chave nunca sai do servidor.
  cliente ??= new Anthropic({ maxRetries: 2, timeout: 90_000 })
  return cliente
}

function esforco(): 'low' | 'medium' | 'high' {
  const valor = process.env.IA_ESFORCO
  return valor === 'low' || valor === 'high' ? valor : 'medium'
}

function limitarNota(n: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)))
}

/** Uma medida por chave, na ordem fixa, mesmo que a IA repita ou esqueça alguma. */
function normalizarMedidas(saida: SaidaIA['medidas']): Medida[] {
  return CHAVES_MEDIDA.map((chave) => {
    const m = saida.find((x) => x.chave === chave)
    const nota = limitarNota(m?.nota ?? 0)
    return {
      chave,
      nota,
      nivel: nivelDaNota(nota),
      confianca: m?.confianca ?? 'baixa',
      observacao: m?.observacao?.trim() || 'Não apareceu na foto.',
    }
  })
}

/** A rota sempre manda base64 (foto limpa pelo sharp); a URL existe para o script de teste. */
export type FotoParaIA = { tipo: 'base64'; jpeg: string } | { tipo: 'url'; url: string }

export async function analisarPele(entrada: {
  foto: FotoParaIA
  respostas: Respostas
  /** Catálogo ativo da loja (o filtro de quem pode receber o quê é feito aqui). */
  catalogo: ProdutoVitrine[]
}): Promise<ResultadoIA> {
  const { elegiveis, avisos } = filtrarElegiveis(entrada.catalogo, entrada.respostas)
  const modelo = process.env.IA_MODELO || MODELO_PADRAO
  const inicio = Date.now()

  let resposta
  try {
    resposta = await obterCliente().beta.messages.parse({
      model: modelo,
      max_tokens: 16000,
      // Se o modelo recusar por política de segurança, a própria API refaz
      // a chamada no modelo alternativo recomendado, dentro da mesma requisição.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: esforco(), format: betaZodOutputFormat(SaidaIASchema) },
      system: [
        {
          type: 'text',
          // Catálogo inteiro (não só os elegíveis): assim o texto é o mesmo
          // para todo mundo e fica em cache.
          text: montarSistema(entrada.catalogo.filter((p) => p.ativo)),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source:
                entrada.foto.tipo === 'base64'
                  ? { type: 'base64', media_type: 'image/jpeg', data: entrada.foto.jpeg }
                  : { type: 'url', url: entrada.foto.url },
            },
            { type: 'text', text: montarMensagem(entrada.respostas, elegiveis.map((p) => p.codigo)) },
          ],
        },
      ],
    })
  } catch (erro) {
    const duracaoMs = Date.now() - inicio
    const uso = null
    if (erro instanceof Anthropic.AuthenticationError || erro instanceof Anthropic.PermissionDeniedError) {
      return { tipo: 'erro', mensagem: 'A análise está fora do ar agora. Avise a loja.', detalhe: `chave da API recusada (${erro.status})`, uso }
    }
    if (erro instanceof Anthropic.RateLimitError) {
      return { tipo: 'erro', mensagem: 'Muitas análises ao mesmo tempo. Tente de novo em um minuto.', detalhe: 'limite de taxa da API', uso }
    }
    if (erro instanceof Anthropic.BadRequestError) {
      return { tipo: 'erro', mensagem: 'Não conseguimos analisar essa foto. Tente outra.', detalhe: `requisição recusada: ${erro.message}`, uso }
    }
    if (erro instanceof Anthropic.APIError) {
      return { tipo: 'erro', mensagem: 'A análise demorou ou falhou. Tente de novo.', detalhe: `erro da API ${erro.status ?? ''}: ${erro.message} (${duracaoMs} ms)`, uso }
    }
    if (erro instanceof Anthropic.AnthropicError) {
      // O SDK lança AnthropicError quando a resposta não bate com o esquema.
      return { tipo: 'erro', mensagem: 'A análise voltou incompleta. Tente de novo.', detalhe: erro.message, uso }
    }
    throw erro
  }

  const uso: UsoIA = {
    modelo: resposta.model,
    tokensEntrada: resposta.usage.input_tokens + (resposta.usage.cache_creation_input_tokens ?? 0),
    tokensSaida: resposta.usage.output_tokens,
    tokensCacheLidos: resposta.usage.cache_read_input_tokens ?? 0,
    duracaoMs: Date.now() - inicio,
  }

  // Sempre conferir o motivo da parada antes de ler o conteúdo.
  if (resposta.stop_reason === 'refusal') {
    return {
      tipo: 'erro',
      mensagem: 'Não conseguimos analisar essa foto. Tente outra, só do rosto.',
      detalhe: `recusa (${resposta.stop_details?.category ?? 'sem categoria'})`,
      uso,
    }
  }
  if (resposta.stop_reason === 'max_tokens') {
    return { tipo: 'erro', mensagem: 'A análise voltou incompleta. Tente de novo.', detalhe: 'max_tokens', uso }
  }

  const saida = resposta.parsed_output
  if (!saida) {
    return { tipo: 'erro', mensagem: 'A análise voltou incompleta. Tente de novo.', detalhe: 'sem parsed_output', uso }
  }

  if (!saida.foto.utilizavel) {
    const problema = saida.foto.problema === 'nenhum' ? 'outro' : saida.foto.problema
    return {
      tipo: 'foto_recusada',
      problema,
      motivo: ROTULO_PROBLEMA_FOTO[problema],
      orientacao:
        saida.foto.orientacao.trim() ||
        'Fique de frente para uma janela, sem maquiagem, e aproxime o celular até o rosto preencher o contorno.',
      uso,
    }
  }

  const medidas = normalizarMedidas(saida.medidas)
  const rotina = montarRotina(saida.rotina, elegiveis, saida.tipoPele, medidas, entrada.respostas)

  return {
    tipo: 'concluida',
    tipoPele: saida.tipoPele,
    resumo: saida.resumo.trim(),
    medidas,
    pontosDeAtencao: [...saida.pontosDeAtencao.map((p) => p.trim()).filter(Boolean), ...avisos, ...rotina.avisos],
    sugerirDermatologista: saida.sugerirDermatologista,
    itens: rotina.itens,
    uso,
  }
}
