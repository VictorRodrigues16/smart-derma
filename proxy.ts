import { NextResponse, type NextRequest } from 'next/server'

/**
 * Filtro rápido antes das páginas logadas: sem o cookie de sessão, nem
 * renderiza, vai direto para /entrar. A conferência de verdade (assinatura,
 * conta ativa e papel) é feita pela guarda em cada página e rota da API.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has('smartderma-sessao')) return NextResponse.next()

  const destino = request.nextUrl.clone()
  destino.pathname = '/entrar'
  destino.search = ''
  return NextResponse.redirect(destino)
}

export const config = {
  matcher: ['/app/:caminho*', '/loja/:caminho*'],
}
