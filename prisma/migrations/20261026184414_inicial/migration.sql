-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('cliente', 'loja');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('limpeza', 'tonico', 'esfoliante', 'serum', 'tratamento', 'area_dos_olhos', 'hidratante', 'protetor', 'mascara');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('manha', 'noite', 'ambos');

-- CreateEnum
CREATE TYPE "StatusAnalise" AS ENUM ('concluida', 'foto_recusada', 'erro');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL DEFAULT 'cliente',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativos" TEXT[],
    "tiposPele" TEXT[],
    "indicacoes" TEXT[],
    "turno" "Turno" NOT NULL,
    "modoDeUso" TEXT NOT NULL,
    "precoCentavos" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL,
    "corredor" TEXT NOT NULL,
    "evitarGestante" BOOLEAN NOT NULL DEFAULT false,
    "evitarSensivel" BOOLEAN NOT NULL DEFAULT false,
    "apenasAdulto" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analise" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "status" "StatusAnalise" NOT NULL,
    "respostas" JSONB NOT NULL,
    "consentimentoEm" TIMESTAMP(3) NOT NULL,
    "tipoPele" TEXT,
    "resumo" TEXT,
    "medidas" JSONB,
    "pontosDeAtencao" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sugerirDermatologista" BOOLEAN NOT NULL DEFAULT false,
    "motivoRecusa" TEXT,
    "orientacaoFoto" TEXT,
    "modelo" TEXT,
    "tokensEntrada" INTEGER NOT NULL DEFAULT 0,
    "tokensSaida" INTEGER NOT NULL DEFAULT 0,
    "tokensCacheLidos" INTEGER NOT NULL DEFAULT 0,
    "duracaoMs" INTEGER NOT NULL DEFAULT 0,
    "avaliacao" INTEGER,
    "comentarioAvaliacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recomendacao" (
    "id" TEXT NOT NULL,
    "analiseId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "ordem" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,

    CONSTRAINT "Recomendacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaAcesso" (
    "chave" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL,
    "ate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativaAcesso_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_codigo_key" ON "Produto"("codigo");

-- CreateIndex
CREATE INDEX "Analise_usuarioId_criadoEm_idx" ON "Analise"("usuarioId", "criadoEm");

-- CreateIndex
CREATE INDEX "Analise_criadoEm_idx" ON "Analise"("criadoEm");

-- CreateIndex
CREATE INDEX "Recomendacao_analiseId_idx" ON "Recomendacao"("analiseId");

-- CreateIndex
CREATE INDEX "Recomendacao_produtoId_idx" ON "Recomendacao"("produtoId");

-- AddForeignKey
ALTER TABLE "Analise" ADD CONSTRAINT "Analise_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recomendacao" ADD CONSTRAINT "Recomendacao_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "Analise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recomendacao" ADD CONSTRAINT "Recomendacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
