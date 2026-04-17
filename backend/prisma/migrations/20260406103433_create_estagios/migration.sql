/*
  Warnings:

  - You are about to drop the column `ativo` on the `EstagioAluno` table. All the data in the column will be lost.
  - You are about to drop the column `campoFixoId` on the `EstagioAluno` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `EstagioAluno` table. All the data in the column will be lost.
  - You are about to drop the column `grupoId` on the `EstagioAluno` table. All the data in the column will be lost.
  - You are about to drop the column `tipoAlocacao` on the `EstagioAluno` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EstagioAluno` table. All the data in the column will be lost.
  - You are about to drop the column `area` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `cargaHorariaComplementar` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `cargaHorariaObrigatoria` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `considerarRecessos` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `diasSemana` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `titulo` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `EstagioBloco` table. All the data in the column will be lost.
  - The `status` column on the `EstagioBloco` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `EstagioCampo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstagioDocumento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstagioFrequencia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstagioGrupo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstagioRodizio` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `campoId` to the `EstagioBloco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cargaHorariaPrevista` to the `EstagioBloco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cursoId` to the `EstagioBloco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `turno` to the `EstagioBloco` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vagas` to the `EstagioBloco` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EstagioAluno" DROP CONSTRAINT "EstagioAluno_blocoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioAluno" DROP CONSTRAINT "EstagioAluno_campoFixoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioAluno" DROP CONSTRAINT "EstagioAluno_grupoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioCampo" DROP CONSTRAINT "EstagioCampo_blocoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioDocumento" DROP CONSTRAINT "EstagioDocumento_alunoEstagioId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioFrequencia" DROP CONSTRAINT "EstagioFrequencia_alunoEstagioId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioFrequencia" DROP CONSTRAINT "EstagioFrequencia_blocoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioFrequencia" DROP CONSTRAINT "EstagioFrequencia_campoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioGrupo" DROP CONSTRAINT "EstagioGrupo_blocoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioRodizio" DROP CONSTRAINT "EstagioRodizio_blocoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioRodizio" DROP CONSTRAINT "EstagioRodizio_campoId_fkey";

-- DropForeignKey
ALTER TABLE "EstagioRodizio" DROP CONSTRAINT "EstagioRodizio_grupoId_fkey";

-- DropIndex
DROP INDEX "EstagioAluno_alunoId_idx";

-- DropIndex
DROP INDEX "EstagioAluno_blocoId_idx";

-- DropIndex
DROP INDEX "EstagioAluno_grupoId_idx";

-- DropIndex
DROP INDEX "EstagioBloco_area_idx";

-- DropIndex
DROP INDEX "EstagioBloco_status_idx";

-- DropIndex
DROP INDEX "EstagioBloco_turmaId_idx";

-- AlterTable
ALTER TABLE "EstagioAluno" DROP COLUMN "ativo",
DROP COLUMN "campoFixoId",
DROP COLUMN "createdAt",
DROP COLUMN "grupoId",
DROP COLUMN "tipoAlocacao",
DROP COLUMN "updatedAt",
ADD COLUMN     "cargaHorariaCumprida" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dataAlocacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "faltas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Alocado';

-- AlterTable
ALTER TABLE "EstagioBloco" DROP COLUMN "area",
DROP COLUMN "ativo",
DROP COLUMN "cargaHorariaComplementar",
DROP COLUMN "cargaHorariaObrigatoria",
DROP COLUMN "considerarRecessos",
DROP COLUMN "diasSemana",
DROP COLUMN "titulo",
DROP COLUMN "updatedAt",
ADD COLUMN     "campoId" INTEGER NOT NULL,
ADD COLUMN     "cargaHorariaPrevista" INTEGER NOT NULL,
ADD COLUMN     "cursoId" INTEGER NOT NULL,
ADD COLUMN     "setor" TEXT,
ADD COLUMN     "turno" TEXT NOT NULL,
ADD COLUMN     "vagas" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Planejado';

-- DropTable
DROP TABLE "EstagioCampo";

-- DropTable
DROP TABLE "EstagioDocumento";

-- DropTable
DROP TABLE "EstagioFrequencia";

-- DropTable
DROP TABLE "EstagioGrupo";

-- DropTable
DROP TABLE "EstagioRodizio";

-- DropEnum
DROP TYPE "EstagioArea";

-- DropEnum
DROP TYPE "EstagioDocumentoStatus";

-- DropEnum
DROP TYPE "EstagioPresencaStatus";

-- DropEnum
DROP TYPE "EstagioStatus";

-- DropEnum
DROP TYPE "EstagioTipoAlocacao";

-- CreateTable
CREATE TABLE "CampoEstagio" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "endereco" TEXT,
    "cidade" TEXT,
    "convenioAtivo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampoEstagio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EstagioBloco" ADD CONSTRAINT "EstagioBloco_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "CampoEstagio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioBloco" ADD CONSTRAINT "EstagioBloco_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioAluno" ADD CONSTRAINT "EstagioAluno_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
