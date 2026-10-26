/**
 * Contas de demonstração criadas pelo seed (prisma/seed.ts).
 * Os atalhos da tela de login entram nelas sem senha, e só funcionam com
 * DEMO_ATALHOS=1. Em produção de verdade, desligue os atalhos.
 */
export const CONTAS_DEMO = {
  cliente: { email: 'cliente@smartderma.app', nome: 'Cliente Demonstração' },
  loja: { email: 'loja@smartderma.app', nome: 'Farmácia Parceira' },
} as const
