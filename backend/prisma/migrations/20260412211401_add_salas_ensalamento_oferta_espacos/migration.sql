-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO');

-- CreateEnum
CREATE TYPE "PeriodoEnsalamento" AS ENUM ('MANHA', 'TARDE', 'NOITE');

-- CreateTable
CREATE TABLE "Sala" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "capacidade" INTEGER,
    "bloco" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnsalamentoItem" (
    "id" SERIAL NOT NULL,
    "salaId" INTEGER NOT NULL,
    "turmaId" INTEGER,
    "diaSemana" "DiaSemana" NOT NULL,
    "periodo" "PeriodoEnsalamento" NOT NULL,
    "textoLivre" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnsalamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaEspaco" (
    "id" SERIAL NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "salaId" INTEGER,
    "textoLivre" TEXT,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfertaEspaco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnsalamentoItem_turmaId_idx" ON "EnsalamentoItem"("turmaId");

-- CreateIndex
CREATE INDEX "EnsalamentoItem_diaSemana_periodo_idx" ON "EnsalamentoItem"("diaSemana", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "EnsalamentoItem_salaId_diaSemana_periodo_key" ON "EnsalamentoItem"("salaId", "diaSemana", "periodo");

-- CreateIndex
CREATE INDEX "OfertaEspaco_ofertaId_idx" ON "OfertaEspaco"("ofertaId");

-- CreateIndex
CREATE INDEX "OfertaEspaco_salaId_idx" ON "OfertaEspaco"("salaId");

-- AddForeignKey
ALTER TABLE "EnsalamentoItem" ADD CONSTRAINT "EnsalamentoItem_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnsalamentoItem" ADD CONSTRAINT "EnsalamentoItem_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaEspaco" ADD CONSTRAINT "OfertaEspaco_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaAcademica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaEspaco" ADD CONSTRAINT "OfertaEspaco_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE SET NULL ON UPDATE CASCADE;
