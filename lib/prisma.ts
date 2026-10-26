import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Em desenvolvimento o Next recarrega os módulos a cada alteração. Sem
 * guardar a instância no global, cada reload abriria um pool novo e o
 * Postgres esgotaria as conexões em poucos minutos.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient }

function criarCliente() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não configurada')

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

export const prisma = globalParaPrisma.prisma ?? criarCliente()

if (process.env.NODE_ENV !== 'production') globalParaPrisma.prisma = prisma
