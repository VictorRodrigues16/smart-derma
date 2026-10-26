/**
 * Carrega o .env.local para scripts rodados fora do Next (seed, teste da IA).
 * Precisa ser o PRIMEIRO import do script: os imports são avaliados na
 * ordem, e lib/prisma.ts lê DATABASE_URL assim que é carregado.
 */
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
