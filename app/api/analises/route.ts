import { NextResponse } from 'next/server'
import { criarAnalise } from '@/lib/servidor/analises'
import { erroJson, sessaoDaApi } from '@/lib/servidor/guarda'

export const runtime = 'nodejs'
// A IA leva de 10 a 40 segundos; folga para o modelo alternativo, se entrar.
export const maxDuration = 120

/** Cliente e totem (conta da loja) podem analisar. */
export async function POST(req: Request) {
  const acesso = await sessaoDaApi()
  if (!acesso.ok) return acesso.resposta

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return erroJson('O envio chegou incompleto. Tente de novo.', 400)
  }

  const foto = form.get('foto')
  const { status, corpo } = await criarAnalise({
    usuarioId: acesso.sessao.id,
    foto: foto instanceof File ? foto : null,
    respostasJson: typeof form.get('respostas') === 'string' ? (form.get('respostas') as string) : null,
    consentimento: typeof form.get('consentimento') === 'string' ? (form.get('consentimento') as string) : null,
  })
  return NextResponse.json(corpo, { status })
}
