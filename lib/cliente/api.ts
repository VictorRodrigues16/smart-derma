/**
 * Chamadas do navegador para a API da Smart Derma.
 *
 * Toda tela usa estas funções em vez de montar fetch na mão: o formato de
 * erro fica num lugar só e a mensagem que chega na tela já é a do servidor.
 */
import type { ProdutoEntrada, RespostaCriarAnalise, RespostaSimples, Respostas } from '@/lib/tipos'
import { prepararArquivo } from './foto'

async function postarJson<T>(url: string, corpo: unknown, metodo: 'POST' | 'PATCH' = 'POST'): Promise<T> {
  try {
    const r = await fetch(url, {
      method: metodo,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo),
    })
    return (await r.json()) as T
  } catch {
    return { ok: false, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' } as T
  }
}

/* Autenticação ------------------------------------------------------- */

export function entrar(email: string, senha: string) {
  return postarJson<RespostaSimples>('/api/auth/entrar', { email, senha })
}

export function cadastrar(nome: string, email: string, senha: string) {
  return postarJson<RespostaSimples>('/api/auth/cadastrar', { nome, email, senha })
}

/** Só funciona com DEMO_ATALHOS=1 no servidor. */
export function entrarDemo(perfil: 'cliente' | 'loja') {
  return postarJson<RespostaSimples>('/api/auth/demo', { perfil })
}

export function sair() {
  return postarJson<RespostaSimples>('/api/auth/sair', {})
}

/* Análises ----------------------------------------------------------- */

/**
 * Envia a foto (já preparada por lib/cliente/foto.ts) e as respostas.
 * Leva de 10 a 40 segundos: a tela deve mostrar o estado de "analisando".
 */
export async function enviarAnalise(
  foto: Blob,
  respostas: Respostas,
  consentimento: boolean,
): Promise<RespostaCriarAnalise> {
  const corpo = new FormData()
  corpo.append('foto', foto, 'rosto.jpg')
  corpo.append('respostas', JSON.stringify(respostas))
  corpo.append('consentimento', consentimento ? 'sim' : 'nao')
  try {
    const r = await fetch('/api/analises', { method: 'POST', body: corpo })
    return (await r.json()) as RespostaCriarAnalise
  } catch {
    return { ok: false, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' }
  }
}

/** nota: 1 = a análise acertou, -1 = errou. */
export function avaliarAnalise(id: string, nota: 1 | -1, comentario?: string) {
  return postarJson<RespostaSimples>(`/api/analises/${id}/avaliacao`, { nota, comentario })
}

/**
 * LGPD: "historico" apaga todas as análises; "conta" apaga a conta inteira
 * e devolve { destino: '/entrar' }.
 */
export function apagarDados(escopo: 'historico' | 'conta') {
  return postarJson<RespostaSimples>('/api/conta/apagar', { escopo })
}

/* Produtos (só conta da loja) --------------------------------------- */

export function criarProduto(produto: ProdutoEntrada) {
  return postarJson<RespostaSimples & { id?: string }>('/api/produtos', produto)
}

export function atualizarProduto(id: string, produto: Partial<ProdutoEntrada>) {
  return postarJson<RespostaSimples>(`/api/produtos/${id}`, produto, 'PATCH')
}

/**
 * Foto do produto: reduz no navegador e sobe para o Vercel Blob.
 * Devolve a URL para pôr em `imagemUrl` ao criar ou atualizar o produto.
 */
export async function enviarImagemProduto(
  arquivo: Blob,
): Promise<{ ok: true; url: string } | { ok: false; erro: string }> {
  let reduzida: Blob
  try {
    reduzida = await prepararArquivo(arquivo)
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : 'Não deu para abrir essa imagem.' }
  }
  const corpo = new FormData()
  corpo.append('imagem', reduzida, 'produto.jpg')
  try {
    const r = await fetch('/api/produtos/imagem', { method: 'POST', body: corpo })
    return (await r.json()) as { ok: true; url: string } | { ok: false; erro: string }
  } catch {
    return { ok: false, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' }
  }
}
