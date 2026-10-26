import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/**
 * Imagem que aparece quando o link é colado no WhatsApp, Teams ou redes.
 * Gerada no build com as fontes da marca guardadas em assets/fontes (sem
 * depender de baixar fonte na hora, senão o texto vira quadradinho).
 */

export const alt = 'Smart Derma: entenda sua pele, escolha melhor'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PETROLEO = '#0E5A55'
const PELE = '#EFC7BD'

export default async function ImagemDeCompartilhamento() {
  const pasta = join(process.cwd(), 'assets/fontes')
  const [titulo, texto] = await Promise.all([
    readFile(join(pasta, 'bricolage-grotesque-latin-700-normal.woff')),
    readFile(join(pasta, 'figtree-latin-500-normal.woff')),
  ])
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: PETROLEO, fontFamily: 'Figtree' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 790,
            padding: '66px 0 62px 76px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width="64" height="64" viewBox="0 0 48 48">
              <rect width="48" height="48" rx="14" fill={PELE} />
              <ellipse
                cx="24"
                cy="24"
                rx="12.5"
                ry="16.5"
                fill="none"
                stroke={PETROLEO}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="0.1 6.44"
              />
              <path
                d="M29 19C29 15.6 19.2 15.6 19.2 20.4C19.2 25 29 23.4 29 28C29 32.6 19.2 32.4 19.2 29"
                fill="none"
                stroke={PETROLEO}
                strokeWidth="3.8"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontFamily: 'Bricolage', fontSize: 38, color: '#FFFFFF', letterSpacing: -1 }}>Smart Derma</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'Bricolage', fontSize: 84, lineHeight: 1.02, color: '#FFFFFF', letterSpacing: -3 }}>
              Entenda sua pele.
            </span>
            <span style={{ fontFamily: 'Bricolage', fontSize: 84, lineHeight: 1.02, color: PELE, letterSpacing: -3 }}>
              Escolha melhor.
            </span>
            <span style={{ marginTop: 28, fontSize: 28, lineHeight: 1.38, color: 'rgba(255,255,255,0.88)', maxWidth: 650 }}>
              Uma foto do rosto, oito medidas da pele e a rotina certa com produtos que a farmácia tem em estoque.
            </span>
          </div>

          <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.72)' }}>{dominio ?? 'Smart Derma'}</span>
        </div>

        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <svg width="330" height="440" viewBox="0 0 330 440">
            <ellipse
              cx="165"
              cy="220"
              rx="148"
              ry="203"
              fill="none"
              stroke={PELE}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="0.1 27"
            />
            <path
              d="M196 189C196 167.92 135.24 167.92 135.24 197.68C135.24 226.2 196 216.28 196 244.8C196 273.32 135.24 272.08 135.24 251"
              fill="none"
              stroke={PELE}
              strokeWidth="24"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Bricolage', data: titulo, weight: 700, style: 'normal' },
        { name: 'Figtree', data: texto, weight: 500, style: 'normal' },
      ],
    },
  )
}
