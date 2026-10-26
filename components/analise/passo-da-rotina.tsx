import { MapPin, Sunrise } from 'lucide-react'
import { ProdutoImagem } from '@/components/produto/produto-imagem'
import { reais } from '@/lib/formatar'
import { ROTULO_CATEGORIA, ROTULO_TURNO, type ItemRotina } from '@/lib/tipos'

/** "B2" vira "Corredor B2"; "Prateleira 3" fica como está. */
function rotuloDoCorredor(corredor: string) {
  const texto = corredor.trim()
  return /^(corredor|prateleira|gôndola|gondola|seção|secao|balcão|balcao)/i.test(texto) ? texto : `Corredor ${texto}`
}

/** Um passo da rotina: produto, motivo, modo de uso, preço e onde achar na loja. */
export function PassoDaRotina({ item }: { item: ItemRotina }) {
  const { produto } = item
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start gap-3.5">
        <ProdutoImagem produto={produto} className="size-[68px]" tamanhos="68px" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] leading-tight font-semibold text-petroleo">{ROTULO_CATEGORIA[produto.categoria]}</p>
          <h3 className="mt-1 font-sans text-[18px] leading-tight font-semibold">{produto.nome}</h3>
          <p className="mt-0.5 text-[15px] text-tinta-suave">{produto.marca}</p>
        </div>
        <p className="shrink-0 font-sans text-[17px] leading-tight font-semibold">{reais(produto.precoCentavos)}</p>
      </div>

      <p className="mt-3 text-[16px] leading-snug">{item.motivo}</p>

      <p className="mt-2.5 rounded-xl bg-nevoa px-3.5 py-3 text-[15px] leading-snug text-tinta-suave">
        <span className="font-semibold text-tinta">Como usar: </span>
        {produto.modoDeUso}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[15px] text-tinta-suave">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0 text-petroleo" aria-hidden />
          {rotuloDoCorredor(produto.corredor)}
        </span>
        {item.turno === 'ambos' ? (
          <span className="inline-flex items-center gap-1.5">
            <Sunrise className="size-4 shrink-0 text-petroleo" aria-hidden />
            {ROTULO_TURNO.ambos}
          </span>
        ) : null}
      </div>
    </div>
  )
}
