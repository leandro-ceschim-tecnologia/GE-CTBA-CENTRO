-- CreateEnum
CREATE TYPE "EstagioArea" AS ENUM ('ENFERMAGEM', 'RADIOLOGIA');

-- CreateEnum
CREATE TYPE "EstagioStatus" AS ENUM ('PLANEJADO', 'ATIVO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstagioTipoAlocacao" AS ENUM ('RODIZIO', 'FIXO');

-- CreateEnum
CREATE TYPE "EstagioPresencaStatus" AS ENUM ('PENDENTE', 'PRESENTE', 'FALTA', 'JUSTIFICADA');

-- CreateEnum
CREATE TYPE "EstagioDocumentoStatus" AS ENUM ('PENDENTE', 'OK');

-- CreateTable
CREATE TABLE "EstagioBloco" (
    "id" SERIAL NOT NULL,
    "area" "EstagioArea" NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "cargaHorariaObrigatoria" INTEGER NOT NULL,
    "cargaHorariaComplementar" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "diasSemana" JSONB NOT NULL,
    "considerarRecessos" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "status" "EstagioStatus" NOT NULL DEFAULT 'PLANEJADO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstagioBloco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioCampo" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 1,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioCampo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioGrupo" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioAluno" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "grupoId" INTEGER,
    "tipoAlocacao" "EstagioTipoAlocacao" NOT NULL DEFAULT 'RODIZIO',
    "campoFixoId" INTEGER,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstagioAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioRodizio" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "campoId" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioRodizio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioFrequencia" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "alunoEstagioId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "campoId" INTEGER,
    "status" "EstagioPresencaStatus" NOT NULL DEFAULT 'PENDENTE',
    "horasCumpridas" DECIMAL(6,2),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstagioFrequencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioDocumento" (
    "id" SERIAL NOT NULL,
    "alunoEstagioId" INTEGER NOT NULL,
    "vaga" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "lac" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "termoAceite" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "termoCiencia" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "termoEstagio" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "luva" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "carteiraVacina" "EstagioDocumentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstagioDocumento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstagioBloco_turmaId_idx" ON "EstagioBloco"("turmaId");

-- CreateIndex
CREATE INDEX "EstagioBloco_area_idx" ON "EstagioBloco"("area");

-- CreateIndex
CREATE INDEX "EstagioBloco_status_idx" ON "EstagioBloco"("status");

-- CreateIndex
CREATE INDEX "EstagioCampo_blocoId_idx" ON "EstagioCampo"("blocoId");

-- CreateIndex
CREATE INDEX "EstagioGrupo_blocoId_idx" ON "EstagioGrupo"("blocoId");

-- CreateIndex
CREATE INDEX "EstagioAluno_blocoId_idx" ON "EstagioAluno"("blocoId");

-- CreateIndex
CREATE INDEX "EstagioAluno_grupoId_idx" ON "EstagioAluno"("grupoId");

-- CreateIndex
CREATE INDEX "EstagioAluno_alunoId_idx" ON "EstagioAluno"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioAluno_blocoId_alunoId_key" ON "EstagioAluno"("blocoId", "alunoId");

-- CreateIndex
CREATE INDEX "EstagioRodizio_blocoId_idx" ON "EstagioRodizio"("blocoId");

-- CreateIndex
CREATE INDEX "EstagioRodizio_grupoId_idx" ON "EstagioRodizio"("grupoId");

-- CreateIndex
CREATE INDEX "EstagioRodizio_campoId_idx" ON "EstagioRodizio"("campoId");

-- CreateIndex
CREATE INDEX "EstagioFrequencia_blocoId_idx" ON "EstagioFrequencia"("blocoId");

-- CreateIndex
CREATE INDEX "EstagioFrequencia_data_idx" ON "EstagioFrequencia"("data");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioFrequencia_alunoEstagioId_data_key" ON "EstagioFrequencia"("alunoEstagioId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioDocumento_alunoEstagioId_key" ON "EstagioDocumento"("alunoEstagioId");

-- AddForeignKey
ALTER TABLE "EstagioBloco" ADD CONSTRAINT "EstagioBloco_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioCampo" ADD CONSTRAINT "EstagioCampo_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioGrupo" ADD CONSTRAINT "EstagioGrupo_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioAluno" ADD CONSTRAINT "EstagioAluno_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioAluno" ADD CONSTRAINT "EstagioAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioAluno" ADD CONSTRAINT "EstagioAluno_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "EstagioGrupo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioAluno" ADD CONSTRAINT "EstagioAluno_campoFixoId_fkey" FOREIGN KEY ("campoFixoId") REFERENCES "EstagioCampo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioRodizio" ADD CONSTRAINT "EstagioRodizio_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioRodizio" ADD CONSTRAINT "EstagioRodizio_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "EstagioGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioRodizio" ADD CONSTRAINT "EstagioRodizio_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "EstagioCampo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioFrequencia" ADD CONSTRAINT "EstagioFrequencia_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioFrequencia" ADD CONSTRAINT "EstagioFrequencia_alunoEstagioId_fkey" FOREIGN KEY ("alunoEstagioId") REFERENCES "EstagioAluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioFrequencia" ADD CONSTRAINT "EstagioFrequencia_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "EstagioCampo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioDocumento" ADD CONSTRAINT "EstagioDocumento_alunoEstagioId_fkey" FOREIGN KEY ("alunoEstagioId") REFERENCES "EstagioAluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
