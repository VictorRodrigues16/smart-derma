import { z } from 'zod'
import { CHAVES_MEDIDA, TIPOS_PELE, TURNOS } from '@/lib/tipos'

/**
 * Formato que a IA é obrigada a devolver (structured outputs).
 *
 * A ordem dos campos é proposital: a IA primeiro julga a foto, depois
 * observa cada característica e só então conclui o tipo de pele, o resumo
 * e a rotina. Concluir antes de observar piora a análise.
 *
 * Os limites numéricos ficam na descrição, não em .min()/.max(): se a IA
 * devolver 101, o código corrige; uma trava rígida aqui derrubaria a
 * análise inteira por um número.
 */

export const PROBLEMAS_FOTO = [
  'nenhum',
  'sem_rosto',
  'varios_rostos',
  'desfocada',
  'escura',
  'muito_distante',
  'maquiagem_ou_filtro',
  'nao_e_foto_real',
  'outro',
] as const
export type ProblemaFoto = (typeof PROBLEMAS_FOTO)[number]

export const ROTULO_PROBLEMA_FOTO: Record<ProblemaFoto, string> = {
  nenhum: 'A foto serviu.',
  sem_rosto: 'Não encontramos um rosto na foto.',
  varios_rostos: 'Apareceu mais de um rosto na foto.',
  desfocada: 'A foto ficou desfocada.',
  escura: 'A luz não deixou ver a pele.',
  muito_distante: 'O rosto ficou pequeno na foto.',
  maquiagem_ou_filtro: 'Maquiagem ou filtro escondem a pele.',
  nao_e_foto_real: 'A imagem não parece uma foto real do rosto.',
  outro: 'A foto não deu para analisar.',
}

export const SaidaIASchema = z.object({
  foto: z.object({
    utilizavel: z.boolean(),
    problema: z.enum(PROBLEMAS_FOTO),
    orientacao: z
      .string()
      .describe('Uma frase dizendo como tirar uma foto melhor. Texto vazio quando a foto serviu.'),
  }),
  medidas: z
    .array(
      z.object({
        chave: z.enum(CHAVES_MEDIDA),
        nota: z.number().describe('Inteiro de 0 a 100. Nota alta = a característica aparece mais.'),
        confianca: z.enum(['baixa', 'media', 'alta']),
        observacao: z.string().describe('Onde e como apareceu, em até 90 caracteres.'),
      }),
    )
    .describe('Exatamente uma entrada para cada uma das oito chaves.'),
  tipoPele: z.enum(TIPOS_PELE),
  resumo: z.string().describe('Duas ou três frases em segunda pessoa.'),
  pontosDeAtencao: z.array(z.string()).describe('Avisos curtos. Lista vazia quando não houver.'),
  sugerirDermatologista: z.boolean(),
  rotina: z
    .array(
      z.object({
        codigo: z.string().describe('Código de um produto da lista PRODUTOS QUE VOCÊ PODE INDICAR.'),
        turno: z.enum(TURNOS),
        motivo: z.string().describe('Uma frase curta em segunda pessoa ligada ao que foi visto.'),
      }),
    )
    .describe('De 3 a 6 produtos. Lista vazia quando a foto não serviu.'),
})

export type SaidaIA = z.infer<typeof SaidaIASchema>
