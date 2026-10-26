import type { Produto } from '@prisma/client'
import type { Categoria, ChaveMedida, ProdutoVitrine, TipoPele, Turno } from '@/lib/tipos'

/**
 * Linha do banco → produto como as telas e a IA enxergam.
 * Fica fora de lib/servidor para os scripts (seed, teste da IA) usarem.
 */
export function paraVitrine(p: Produto): ProdutoVitrine {
  return {
    id: p.id,
    codigo: p.codigo,
    nome: p.nome,
    marca: p.marca,
    categoria: p.categoria as Categoria,
    descricao: p.descricao,
    ativos: p.ativos,
    tiposPele: p.tiposPele as TipoPele[],
    indicacoes: p.indicacoes as ChaveMedida[],
    turno: p.turno as Turno,
    modoDeUso: p.modoDeUso,
    imagemUrl: p.imagemUrl,
    precoCentavos: p.precoCentavos,
    estoque: p.estoque,
    corredor: p.corredor,
    evitarGestante: p.evitarGestante,
    evitarSensivel: p.evitarSensivel,
    apenasAdulto: p.apenasAdulto,
    ativo: p.ativo,
  }
}
