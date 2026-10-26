import { BlocoCarregando } from '@/components/ui/bloco-carregando'

/** Esqueleto do catálogo enquanto os produtos carregam. */
export default function CarregandoProdutos() {
  return (
    <div role="status" aria-label="Carregando os produtos">
      <BlocoCarregando className="h-12 w-60" />
      <BlocoCarregando className="mt-4 h-5 w-96 max-w-full rounded-full" />
      <BlocoCarregando className="mt-8 h-12" />
      <BlocoCarregando className="mt-6 h-20" />
      <BlocoCarregando className="mt-3 h-20" />
      <BlocoCarregando className="mt-3 h-20" />
    </div>
  )
}
