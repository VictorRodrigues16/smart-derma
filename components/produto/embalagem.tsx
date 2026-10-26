import type { Categoria } from '@/lib/tipos'

/**
 * Ilustração de embalagem por categoria. Os produtos não têm foto, então cada
 * categoria ganha um frasco, um conta-gotas, uma bisnaga ou um pote desenhado
 * na paleta da marca. Cores fixas (não variáveis de CSS) para o desenho sair
 * igual em qualquer lugar onde o SVG for usado.
 */

const COR = {
  petroleo: '#0E5A55',
  petroleoEscuro: '#0B4642',
  pele: '#EFC7BD',
  peleForte: '#E8B3A4',
  rosado: '#FBEFEC',
  nevoa: '#EEF3F2',
  menta: '#E3F0EE',
  mentaForte: '#CFE5E1',
  terracota: '#D88F7E',
  tinta: '#16201F',
  branco: '#FFFFFF',
} as const

type Tema = {
  fundo: string
  corpo: string
  tampa: string
  tampaEscura: string
  rotulo: string
  liquido?: string
  selo?: 'oval' | 'sol'
}

type Formato = 'bomba' | 'tampa' | 'gotas' | 'bisnaga' | 'bisnagaFina' | 'pote' | 'poteBaixo'

const POR_CATEGORIA: Record<Categoria, { formato: Formato; tema: Tema }> = {
  limpeza: {
    formato: 'bomba',
    tema: { fundo: COR.menta, corpo: COR.branco, tampa: COR.petroleo, tampaEscura: COR.petroleoEscuro, rotulo: COR.mentaForte },
  },
  tonico: {
    formato: 'tampa',
    tema: { fundo: COR.nevoa, corpo: COR.mentaForte, tampa: COR.petroleo, tampaEscura: COR.petroleoEscuro, rotulo: COR.branco },
  },
  esfoliante: {
    formato: 'bisnaga',
    tema: { fundo: COR.rosado, corpo: COR.pele, tampa: COR.petroleo, tampaEscura: COR.petroleoEscuro, rotulo: COR.branco },
  },
  serum: {
    formato: 'gotas',
    tema: {
      fundo: COR.menta,
      corpo: COR.branco,
      tampa: COR.petroleo,
      tampaEscura: COR.petroleoEscuro,
      rotulo: COR.branco,
      liquido: COR.terracota,
    },
  },
  tratamento: {
    formato: 'gotas',
    tema: {
      fundo: COR.rosado,
      corpo: COR.branco,
      tampa: COR.pele,
      tampaEscura: COR.terracota,
      rotulo: COR.menta,
      liquido: COR.petroleo,
    },
  },
  area_dos_olhos: {
    formato: 'bisnagaFina',
    tema: { fundo: COR.nevoa, corpo: COR.branco, tampa: COR.terracota, tampaEscura: '#BF7766', rotulo: COR.pele },
  },
  hidratante: {
    formato: 'pote',
    tema: { fundo: COR.rosado, corpo: COR.branco, tampa: COR.petroleo, tampaEscura: COR.petroleoEscuro, rotulo: COR.menta },
  },
  protetor: {
    formato: 'bisnaga',
    tema: {
      fundo: COR.nevoa,
      corpo: COR.peleForte,
      tampa: COR.petroleoEscuro,
      tampaEscura: COR.tinta,
      rotulo: COR.branco,
      selo: 'sol',
    },
  },
  mascara: {
    formato: 'poteBaixo',
    tema: { fundo: COR.menta, corpo: COR.petroleo, tampa: COR.pele, tampaEscura: COR.peleForte, rotulo: COR.menta },
  },
}

/** Marca de rótulo: o contorno oval pontilhado da Smart Derma (ou um sol, no protetor) e linhas de texto. */
function Rotulo({
  x,
  y,
  largura,
  altura,
  cor,
  traco,
  selo = 'oval',
}: {
  x: number
  y: number
  largura: number
  altura: number
  cor: string
  traco: string
  selo?: 'oval' | 'sol'
}) {
  const cx = x + largura / 2
  const folga = 4
  const duasLinhas = altura >= 30
  const alturaLinhas = duasLinhas ? 7 : 2.4
  const yLinhas = y + altura - folga - alturaLinhas
  const espaco = yLinhas - 2 - (y + folga)
  const ry = Math.min(espaco / 2, 8)
  const cy = y + folga + espaco / 2
  const rx = ry * 0.74
  return (
    <g>
      <rect x={x} y={y} width={largura} height={altura} rx={6} fill={cor} />
      {ry >= 2.8 && selo === 'oval' ? (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={traco}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="0.1 3.2"
        />
      ) : null}
      {ry >= 2.8 && selo === 'sol' ? (
        <g>
          <circle cx={cx} cy={cy} r={Math.min(ry * 0.5, 3)} fill={COR.terracota} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI) / 4
            const r1 = Math.min(ry * 0.5, 3) + 1.5
            const r2 = r1 + 2.2
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * r1}
                y1={cy + Math.sin(a) * r1}
                x2={cx + Math.cos(a) * r2}
                y2={cy + Math.sin(a) * r2}
                stroke={COR.terracota}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            )
          })}
        </g>
      ) : null}
      <rect x={cx - largura * 0.3} y={yLinhas} width={largura * 0.6} height={2.4} rx={1.2} fill={traco} opacity={0.55} />
      {duasLinhas ? (
        <rect x={cx - largura * 0.2} y={yLinhas + 4.6} width={largura * 0.4} height={2.4} rx={1.2} fill={traco} opacity={0.35} />
      ) : null}
    </g>
  )
}

function Brilho({ x, y, altura }: { x: number; y: number; altura: number }) {
  return <rect x={x} y={y} width={3.6} height={altura} rx={1.8} fill={COR.branco} opacity={0.5} />
}

function FrascoBomba({ t }: { t: Tema }) {
  return (
    <g>
      <rect x={56.5} y={21} width={7} height={13} rx={1.5} fill={t.tampa} />
      <rect x={48} y={12} width={24} height={10} rx={5} fill={t.tampa} />
      <rect x={66} y={14.5} width={16} height={4.6} rx={2.3} fill={t.tampa} />
      <rect x={50} y={32} width={20} height={10} rx={2.5} fill={t.tampaEscura} />
      <rect x={38} y={40} width={44} height={64} rx={13} fill={t.corpo} stroke={COR.mentaForte} strokeWidth={1.2} />
      <Brilho x={43.5} y={50} altura={44} />
      <Rotulo x={44} y={60} largura={32} altura={32} cor={t.rotulo} traco={COR.petroleo} selo={t.selo} />
    </g>
  )
}

function FrascoTampa({ t }: { t: Tema }) {
  return (
    <g>
      <rect x={47} y={11} width={26} height={21} rx={5.5} fill={t.tampa} />
      <rect x={52} y={15} width={1.6} height={13} rx={0.8} fill={COR.branco} opacity={0.25} />
      <rect x={59.2} y={15} width={1.6} height={13} rx={0.8} fill={COR.branco} opacity={0.25} />
      <rect x={66.4} y={15} width={1.6} height={13} rx={0.8} fill={COR.branco} opacity={0.25} />
      <rect x={51} y={30} width={18} height={9} fill={t.corpo} />
      <path d="M38 54 Q38 38 53 38 H67 Q82 38 82 54 V92 Q82 104 70 104 H50 Q38 104 38 92 Z" fill={t.corpo} />
      <Brilho x={43} y={52} altura={42} />
      <Rotulo x={44} y={58} largura={32} altura={36} cor={t.rotulo} traco={COR.petroleo} selo={t.selo} />
    </g>
  )
}

function ContaGotas({ t }: { t: Tema }) {
  const liquido = t.liquido ?? COR.terracota
  return (
    <g>
      <rect x={53} y={7} width={14} height={29} rx={7} fill={t.tampa} />
      <rect x={48.5} y={32} width={23} height={13} rx={3.5} fill={t.tampaEscura} />
      <rect x={48.5} y={37.4} width={23} height={1.6} fill={COR.branco} opacity={0.25} />
      <path d="M41 58 Q41 45 54 45 H66 Q79 45 79 58 V93 Q79 104 68 104 H52 Q41 104 41 93 Z" fill={t.corpo} stroke={COR.mentaForte} strokeWidth={1.2} />
      <path d="M41.6 66 H78.4 V93 Q78.4 103.4 68 103.4 H52 Q41.6 103.4 41.6 93 Z" fill={liquido} opacity={0.88} />
      <rect x={58} y={45} width={4} height={34} rx={2} fill={COR.branco} opacity={0.7} />
      <Brilho x={44.5} y={54} altura={40} />
      <Rotulo x={46} y={76} largura={28} altura={22} cor={t.rotulo} traco={COR.petroleo} selo={t.selo} />
    </g>
  )
}

function Bisnaga({ t, fina = false }: { t: Tema; fina?: boolean }) {
  const x1 = fina ? 47 : 41
  const x2 = fina ? 73 : 79
  const b1 = fina ? 44 : 36
  const b2 = fina ? 76 : 84
  const larguraTampa = fina ? 18 : 26
  const xTampa = 60 - larguraTampa / 2
  const larguraRotulo = fina ? 24 : 36
  const xRotulo = 60 - larguraRotulo / 2
  return (
    <g>
      <rect x={x1 - 1} y={10} width={x2 - x1 + 2} height={9} rx={2} fill={t.corpo} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={i}
          x={x1 + 3 + i * ((x2 - x1 - 6) / 4)}
          y={11.6}
          width={1.3}
          height={5.8}
          rx={0.6}
          fill={COR.tinta}
          opacity={0.14}
        />
      ))}
      <path d={`M${x1} 19 H${x2} L${b2} 90 Q${b2} 94 ${b2 - 4} 94 H${b1 + 4} Q${b1} 94 ${b1} 90 Z`} fill={t.corpo} />
      <rect x={xTampa} y={94} width={larguraTampa} height={12} rx={3.5} fill={t.tampa} />
      <rect x={xTampa} y={94} width={larguraTampa} height={2.2} fill={COR.tinta} opacity={0.12} />
      <path d={`M${x1 + 4} 26 L${b1 + 4} 86`} stroke={COR.branco} strokeWidth={3} strokeLinecap="round" opacity={0.45} />
      <Rotulo x={xRotulo} y={fina ? 40 : 38} largura={larguraRotulo} altura={fina ? 36 : 36} cor={t.rotulo} traco={COR.petroleo} selo={t.selo} />
    </g>
  )
}

function Pote({ t, baixo = false }: { t: Tema; baixo?: boolean }) {
  const topoTampa = baixo ? 52 : 40
  const alturaTampa = baixo ? 20 : 24
  const topoCorpo = topoTampa + alturaTampa - 3
  const base = 104
  return (
    <g>
      <path d={`M28 ${topoCorpo} H92 V${base - 14} Q92 ${base} 78 ${base} H42 Q28 ${base} 28 ${base - 14} Z`} fill={t.corpo} />
      <rect x={22} y={topoTampa} width={76} height={alturaTampa} rx={9} fill={t.tampa} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect key={i} x={30 + i * 7.5} y={topoTampa + 4} width={1.4} height={alturaTampa - 8} rx={0.7} fill={COR.tinta} opacity={0.14} />
      ))}
      <rect x={26} y={topoTampa + 2.4} width={68} height={2.4} rx={1.2} fill={COR.branco} opacity={0.35} />
      <Rotulo x={36} y={topoCorpo + 7} largura={48} altura={base - topoCorpo - 13} cor={t.rotulo} traco={COR.petroleo} selo={t.selo} />
    </g>
  )
}

function Desenho({ formato, tema }: { formato: Formato; tema: Tema }) {
  switch (formato) {
    case 'bomba':
      return <FrascoBomba t={tema} />
    case 'tampa':
      return <FrascoTampa t={tema} />
    case 'gotas':
      return <ContaGotas t={tema} />
    case 'bisnaga':
      return <Bisnaga t={tema} />
    case 'bisnagaFina':
      return <Bisnaga t={tema} fina />
    case 'pote':
      return <Pote t={tema} />
    case 'poteBaixo':
      return <Pote t={tema} baixo />
  }
}

type Props = {
  categoria: Categoria
  className?: string
  /** Texto para leitor de tela. Sem ele, a ilustração é decorativa. */
  titulo?: string
  /** Quadrado de fundo com a cor da categoria. */
  fundo?: boolean
}

export function Embalagem({ categoria, className, titulo, fundo = true }: Props) {
  const { formato, tema } = POR_CATEGORIA[categoria]
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      {fundo ? <rect width={120} height={120} rx={28} fill={tema.fundo} /> : null}
      <ellipse cx={60} cy={106} rx={27} ry={4.2} fill={COR.tinta} opacity={0.09} />
      <Desenho formato={formato} tema={tema} />
    </svg>
  )
}
