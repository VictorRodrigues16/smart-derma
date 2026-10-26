import { redirect } from 'next/navigation'
import { destinoDoPapel, lerSessao } from '@/lib/servidor/sessao'

/** Porta de entrada: com sessão vai para a área da pessoa, sem sessão vai para o login. */
export default async function Inicio() {
  const sessao = await lerSessao()
  redirect(sessao ? destinoDoPapel(sessao.papel) : '/entrar')
}
