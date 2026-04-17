/*
  Warnings:

  - Changed the type of `role` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'pedagogico', 'coordenacao', 'coordsetor', 'instrutor', 'aluno', 'comercial', 'secretaria');

-- CreateEnum
CREATE TYPE "AlunoTurmaDisciplinaOrigem" AS ENUM ('BASE', 'PENDENCIA', 'REPOSICAO', 'EXTRA');

-- CreateEnum
CREATE TYPE "FrequenciaLancamentoStatus" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "FrequenciaAlunoStatus" AS ENUM ('NAO_LANCADO', 'PRESENTE', 'FALTA', 'FALTA_JUSTIFICADA');

-- CreateEnum
CREATE TYPE "EvasaoRegraTipo" AS ENUM ('FALTA_INDIVIDUAL', 'DUAS_FALTAS_CONSECUTIVAS', 'EVASAO_12_FALTAS');

-- CreateEnum
CREATE TYPE "EvasaoOcorrenciaStatus" AS ENUM ('PENDENTE_CONTATO', 'EM_TRATATIVA', 'TRATADO', 'LANCADO_SISTEMA', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EvasaoTipoContato" AS ENUM ('LIGACAO', 'WHATSAPP', 'PRESENCIAL', 'OUTRO');

-- AlterEnum
ALTER TYPE "InformativoPublicoRole" ADD VALUE 'COORDSETOR';

-- AlterEnum
ALTER TYPE "OfertaPublicoRole" ADD VALUE 'COORDSETOR';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL;

-- CreateTable
CREATE TABLE "AlunoTurmaDisciplina" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "turmaDisciplinaId" INTEGER NOT NULL,
    "origem" "AlunoTurmaDisciplinaOrigem" NOT NULL DEFAULT 'BASE',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlunoTurmaDisciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequenciaLancamento" (
    "id" SERIAL NOT NULL,
    "cronogramaAulaId" INTEGER NOT NULL,
    "status" "FrequenciaLancamentoStatus" NOT NULL DEFAULT 'ABERTO',
    "lancadoPorId" INTEGER,
    "fechadoPorId" INTEGER,
    "lancadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrequenciaLancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequenciaAluno" (
    "id" SERIAL NOT NULL,
    "frequenciaLancamentoId" INTEGER NOT NULL,
    "cronogramaAulaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "alunoTurmaDisciplinaId" INTEGER,
    "status" "FrequenciaAlunoStatus" NOT NULL DEFAULT 'NAO_LANCADO',
    "justificativa" TEXT,
    "observacoes" TEXT,
    "updatedById" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrequenciaAluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvasaoOcorrencia" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "cursoId" INTEGER,
    "turmaId" INTEGER,
    "turmaDisciplinaId" INTEGER,
    "frequenciaAlunoId" INTEGER,
    "regraTipo" "EvasaoRegraTipo" NOT NULL,
    "qtdFaltas" INTEGER NOT NULL DEFAULT 0,
    "dataReferencia" TIMESTAMP(3) NOT NULL,
    "descricaoRegra" TEXT,
    "status" "EvasaoOcorrenciaStatus" NOT NULL DEFAULT 'PENDENTE_CONTATO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorId" INTEGER,
    "atualizadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvasaoOcorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvasaoTratativa" (
    "id" SERIAL NOT NULL,
    "evasaoOcorrenciaId" INTEGER NOT NULL,
    "responsavelId" INTEGER NOT NULL,
    "tipoContato" "EvasaoTipoContato" NOT NULL DEFAULT 'LIGACAO',
    "descricao" TEXT NOT NULL,
    "retornoAluno" TEXT,
    "observacoes" TEXT,
    "dataContato" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lancadoSistemaInterno" BOOLEAN NOT NULL DEFAULT false,
    "dataLancamentoSistema" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvasaoTratativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlunoTurmaDisciplina_alunoId_idx" ON "AlunoTurmaDisciplina"("alunoId");

-- CreateIndex
CREATE INDEX "AlunoTurmaDisciplina_turmaId_idx" ON "AlunoTurmaDisciplina"("turmaId");

-- CreateIndex
CREATE INDEX "AlunoTurmaDisciplina_turmaDisciplinaId_idx" ON "AlunoTurmaDisciplina"("turmaDisciplinaId");

-- CreateIndex
CREATE INDEX "AlunoTurmaDisciplina_origem_idx" ON "AlunoTurmaDisciplina"("origem");

-- CreateIndex
CREATE INDEX "AlunoTurmaDisciplina_ativo_idx" ON "AlunoTurmaDisciplina"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "AlunoTurmaDisciplina_alunoId_turmaDisciplinaId_key" ON "AlunoTurmaDisciplina"("alunoId", "turmaDisciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "FrequenciaLancamento_cronogramaAulaId_key" ON "FrequenciaLancamento"("cronogramaAulaId");

-- CreateIndex
CREATE INDEX "FrequenciaLancamento_status_idx" ON "FrequenciaLancamento"("status");

-- CreateIndex
CREATE INDEX "FrequenciaLancamento_lancadoPorId_idx" ON "FrequenciaLancamento"("lancadoPorId");

-- CreateIndex
CREATE INDEX "FrequenciaLancamento_fechadoPorId_idx" ON "FrequenciaLancamento"("fechadoPorId");

-- CreateIndex
CREATE INDEX "FrequenciaLancamento_lancadoEm_idx" ON "FrequenciaLancamento"("lancadoEm");

-- CreateIndex
CREATE INDEX "FrequenciaAluno_cronogramaAulaId_idx" ON "FrequenciaAluno"("cronogramaAulaId");

-- CreateIndex
CREATE INDEX "FrequenciaAluno_alunoId_idx" ON "FrequenciaAluno"("alunoId");

-- CreateIndex
CREATE INDEX "FrequenciaAluno_alunoTurmaDisciplinaId_idx" ON "FrequenciaAluno"("alunoTurmaDisciplinaId");

-- CreateIndex
CREATE INDEX "FrequenciaAluno_status_idx" ON "FrequenciaAluno"("status");

-- CreateIndex
CREATE INDEX "FrequenciaAluno_updatedById_idx" ON "FrequenciaAluno"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "FrequenciaAluno_frequenciaLancamentoId_alunoId_key" ON "FrequenciaAluno"("frequenciaLancamentoId", "alunoId");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_alunoId_idx" ON "EvasaoOcorrencia"("alunoId");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_cursoId_idx" ON "EvasaoOcorrencia"("cursoId");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_turmaId_idx" ON "EvasaoOcorrencia"("turmaId");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_turmaDisciplinaId_idx" ON "EvasaoOcorrencia"("turmaDisciplinaId");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_frequenciaAlunoId_idx" ON "EvasaoOcorrencia"("frequenciaAlunoId");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_regraTipo_idx" ON "EvasaoOcorrencia"("regraTipo");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_status_idx" ON "EvasaoOcorrencia"("status");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_ativo_idx" ON "EvasaoOcorrencia"("ativo");

-- CreateIndex
CREATE INDEX "EvasaoOcorrencia_dataReferencia_idx" ON "EvasaoOcorrencia"("dataReferencia");

-- CreateIndex
CREATE INDEX "EvasaoTratativa_evasaoOcorrenciaId_idx" ON "EvasaoTratativa"("evasaoOcorrenciaId");

-- CreateIndex
CREATE INDEX "EvasaoTratativa_responsavelId_idx" ON "EvasaoTratativa"("responsavelId");

-- CreateIndex
CREATE INDEX "EvasaoTratativa_tipoContato_idx" ON "EvasaoTratativa"("tipoContato");

-- CreateIndex
CREATE INDEX "EvasaoTratativa_dataContato_idx" ON "EvasaoTratativa"("dataContato");

-- CreateIndex
CREATE INDEX "EvasaoTratativa_lancadoSistemaInterno_idx" ON "EvasaoTratativa"("lancadoSistemaInterno");

-- AddForeignKey
ALTER TABLE "AlunoTurmaDisciplina" ADD CONSTRAINT "AlunoTurmaDisciplina_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoTurmaDisciplina" ADD CONSTRAINT "AlunoTurmaDisciplina_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlunoTurmaDisciplina" ADD CONSTRAINT "AlunoTurmaDisciplina_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "TurmaDisciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaLancamento" ADD CONSTRAINT "FrequenciaLancamento_cronogramaAulaId_fkey" FOREIGN KEY ("cronogramaAulaId") REFERENCES "CronogramaAula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaLancamento" ADD CONSTRAINT "FrequenciaLancamento_lancadoPorId_fkey" FOREIGN KEY ("lancadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaLancamento" ADD CONSTRAINT "FrequenciaLancamento_fechadoPorId_fkey" FOREIGN KEY ("fechadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaAluno" ADD CONSTRAINT "FrequenciaAluno_frequenciaLancamentoId_fkey" FOREIGN KEY ("frequenciaLancamentoId") REFERENCES "FrequenciaLancamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaAluno" ADD CONSTRAINT "FrequenciaAluno_cronogramaAulaId_fkey" FOREIGN KEY ("cronogramaAulaId") REFERENCES "CronogramaAula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaAluno" ADD CONSTRAINT "FrequenciaAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaAluno" ADD CONSTRAINT "FrequenciaAluno_alunoTurmaDisciplinaId_fkey" FOREIGN KEY ("alunoTurmaDisciplinaId") REFERENCES "AlunoTurmaDisciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequenciaAluno" ADD CONSTRAINT "FrequenciaAluno_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "TurmaDisciplina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_frequenciaAlunoId_fkey" FOREIGN KEY ("frequenciaAlunoId") REFERENCES "FrequenciaAluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoOcorrencia" ADD CONSTRAINT "EvasaoOcorrencia_atualizadoPorId_fkey" FOREIGN KEY ("atualizadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoTratativa" ADD CONSTRAINT "EvasaoTratativa_evasaoOcorrenciaId_fkey" FOREIGN KEY ("evasaoOcorrenciaId") REFERENCES "EvasaoOcorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvasaoTratativa" ADD CONSTRAINT "EvasaoTratativa_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
