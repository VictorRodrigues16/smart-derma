import { BlocoCarregando } from '@/components/ui/bloco-carregando'

/** Esqueleto do painel enquanto os números carregam. */
export default function CarregandoPainel() {
  return (
    <div role="status" aria-label="Carregando o painel">
      <BlocoCarregando className="h-4 w-40 rounded-full" />
      <BlocoCarregando className="mt-3 h-12 w-72" />
      <BlocoCarregando className="mt-9 h-[220px] rounded-[26px]" />
      <div className="mt-14 grid gap-10 xl:grid-cols-[1.5fr_1fr]">
        <BlocoCarregando className="h-[300px]" />
        <BlocoCarregando className="h-[300px]" />
      </div>
    </div>
  )
}
