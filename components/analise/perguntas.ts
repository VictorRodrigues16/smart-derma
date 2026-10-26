import {
  OPCOES_FAIXA_ETARIA,
  OPCOES_GESTANTE,
  OPCOES_INCOMODOS,
  OPCOES_ORCAMENTO,
  OPCOES_SENSIVEL,
  OPCOES_TIPO_PERCEBIDO,
  type Respostas,
} from '@/lib/tipos'

/**
 * As seis perguntas do início da análise, na ordem em que aparecem.
 * Os rótulos e as opções vêm de lib/tipos.ts; aqui só moram o enunciado, a
 * ajuda e o aviso que explica o efeito de uma resposta.
 */

type OpcaoTela = { valor: string; rotulo: string; detalhe?: string }

export type ChaveUnica = Exclude<keyof Respostas, 'incomodos'>

export type PerguntaUnica = {
  tipo: 'unica'
  chave: ChaveUnica
  titulo: string
  ajuda?: string
  opcoes: OpcaoTela[]
  /** Explica o que a resposta muda na rotina (espelha as travas de segurança do servidor). */
  aviso?: (valor: string) => string | null
}

export type PerguntaMultipla = {
  tipo: 'multipla'
  chave: 'incomodos'
  titulo: string
  ajuda?: string
  opcoes: OpcaoTela[]
}

export type Pergunta = PerguntaUnica | PerguntaMultipla

export const PERGUNTAS: Pergunta[] = [
  {
    tipo: 'unica',
    chave: 'tipoPercebido',
    titulo: 'Como você sente sua pele no fim do dia?',
    ajuda: 'Pense na testa, no nariz e nas bochechas.',
    opcoes: OPCOES_TIPO_PERCEBIDO,
  },
  {
    tipo: 'multipla',
    chave: 'incomodos',
    titulo: 'O que mais incomoda na sua pele?',
    ajuda: 'Pode escolher quantas quiser.',
    opcoes: OPCOES_INCOMODOS,
  },
  {
    tipo: 'unica',
    chave: 'sensivel',
    titulo: 'Sua pele é sensível ou reage a ativos?',
    ajuda: 'Por exemplo, vermelhidão, coceira ou ardência depois de usar um cosmético.',
    opcoes: OPCOES_SENSIVEL,
    aviso: (valor) => (valor === 'sim' ? 'Vamos preferir fórmulas calmantes e deixar ácidos e ativos fortes de fora.' : null),
  },
  {
    tipo: 'unica',
    chave: 'gestante',
    titulo: 'Você está grávida ou amamentando?',
    ajuda: 'Alguns ativos não são indicados nessa fase. Usamos a resposta só para escolher produtos seguros.',
    opcoes: OPCOES_GESTANTE,
    aviso: (valor) =>
      valor === 'sim' || valor === 'prefiro_nao_dizer'
        ? 'Por segurança, deixamos de fora os ativos que não são indicados na gravidez e na amamentação.'
        : null,
  },
  {
    tipo: 'unica',
    chave: 'faixaEtaria',
    titulo: 'Qual é a sua faixa etária?',
    opcoes: OPCOES_FAIXA_ETARIA,
    aviso: (valor) =>
      valor === 'menos_18' ? 'Para menores de 18 anos, a rotina fica no básico, com fórmulas suaves.' : null,
  },
  {
    tipo: 'unica',
    chave: 'orcamento',
    titulo: 'Quanto você quer gastar, no máximo, em cada produto?',
    ajuda: 'Só indicamos produtos que cabem nesse valor.',
    opcoes: OPCOES_ORCAMENTO,
  },
]
