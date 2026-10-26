import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// O projeto guarda os segredos em .env.local (padrão do Next).
config({ path: '.env.local' })

// No Prisma 7 a URL sai do schema e vem para cá.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { seed: 'tsx prisma/seed.ts' },
  datasource: { url: process.env.DATABASE_URL! },
})
