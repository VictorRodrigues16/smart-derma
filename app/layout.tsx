import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Figtree } from 'next/font/google'
import type { ReactNode } from 'react'
import { Provedores } from '@/components/provedores'
import './globals.css'

/** Títulos: Bricolage Grotesque, com o eixo de tamanho óptico (letras mais fechadas e marcantes em corpo grande). */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-bricolage',
})

/** Texto: Figtree, redonda e legível em corpo pequeno. */
const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
})

const DESCRICAO =
  'Entenda sua pele. Escolha melhor. Responda algumas perguntas, tire uma foto e receba uma rotina de manhã e de noite só com produtos que a farmácia tem em estoque.'

// Na Vercel, o endereço de produção vem do ambiente; local, a porta do dev.
const ENDERECO = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:4370'

export const metadata: Metadata = {
  metadataBase: new URL(ENDERECO),
  title: { default: 'Smart Derma', template: '%s | Smart Derma' },
  description: DESCRICAO,
  applicationName: 'Smart Derma',
  icons: { apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Smart Derma',
    title: 'Smart Derma: entenda sua pele, escolha melhor',
    description: DESCRICAO,
  },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#0E5A55',
  width: 'device-width',
  initialScale: 1,
  // Libera env(safe-area-inset-*) para as barras fixas no iPhone.
  viewportFit: 'cover',
}

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>
        <a
          href="#conteudo"
          className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-full bg-petroleo px-5 py-3 font-semibold text-white transition-transform focus:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <Provedores>{children}</Provedores>
      </body>
    </html>
  )
}
