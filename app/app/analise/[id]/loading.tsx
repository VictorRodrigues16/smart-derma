import { BlocoCarregando } from '@/components/ui/bloco-carregando'

/** Esqueleto do resultado enquanto a análise carrega. */
export default function CarregandoResultado() {
  return (
    <div className="flex flex-1 flex-col px-4 pt-2" role="status" aria-label="Carregando a análise">
      <BlocoCarregando className="h-[250px] rounded-[30px] bg-petroleo/10" />
      <BlocoCarregando className="mt-10 ml-1 h-7 w-64 rounded-full" />
      <BlocoCarregando className="mt-6 h-16" />
      <BlocoCarregando className="mt-4 h-16" />
      <BlocoCarregando className="mt-4 h-16" />
    </div>
  )
}
