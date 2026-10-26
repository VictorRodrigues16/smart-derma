import type { NextConfig } from 'next'
import { join } from 'node:path'

/**
 * A câmera é usada pela própria página (getUserMedia) na tela de análise,
 * então a Permissions-Policy libera `camera=(self)`. Microfone e
 * localização continuam fechados: a Smart Derma não precisa de nenhum dos dois.
 */
// Em desenvolvimento o React usa eval para remontar a pilha de erros do
// servidor no navegador, e o recarregamento automático fala por websocket.
const DEV = process.env.NODE_ENV !== 'production'

const CSP = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${DEV ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  // Fotos dos produtos ficam no Vercel Blob.
  `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com`,
  `media-src 'self' blob:`,
  `font-src 'self' data:`,
  `connect-src 'self'${DEV ? ' ws: wss:' : ''}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join('; ')

const CABECALHOS = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  // Raiz do watcher travada neste projeto. Sem isso, um lockfile perdido na
  // pasta-mãe faz o Turbopack vigiar todos os projetos vizinhos.
  turbopack: {
    root: join(__dirname),
  },
  poweredByHeader: false,
  // sharp roda no servidor para limpar e reduzir a foto antes de ir para a IA.
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async headers() {
    return [
      { source: '/:caminho*', headers: CABECALHOS },
      {
        source: '/(app|loja|api)/:caminho*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
        ],
      },
    ]
  },
}

export default nextConfig
