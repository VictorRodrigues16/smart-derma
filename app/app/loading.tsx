import { BlocoCarregando } from '@/components/ui/bloco-carregando'

/** Esqueleto da tela inicial enquanto o histórico carrega. */
export default function CarregandoInicio() {
  return (
    <div className="flex flex-1 flex-col px-5 pt-1" role="status" aria-label="Carregando">
      <BlocoCarregando className="h-4 w-48 rounded-full" />
      <BlocoCarregando className="mt-3 h-10 w-56" />
      <BlocoCarregando className="mt-8 h-[250px] rounded-[28px]" />
      <BlocoCarregando className="mt-10 h-6 w-44 rounded-full" />
      <BlocoCarregando className="mt-4 h-[120px] rounded-[22px]" />
    </div>
  )
}
