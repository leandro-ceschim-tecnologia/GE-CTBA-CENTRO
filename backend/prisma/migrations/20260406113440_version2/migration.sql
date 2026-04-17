/*
  Warnings:

  - You are about to drop the column `campoId` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `setor` on the `EstagioBloco` table. All the data in the column will be lost.
  - You are about to drop the column `vagas` on the `EstagioBloco` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[turmaId,numeroBloco]` on the table `EstagioBloco` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numeroBloco` to the `EstagioBloco` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EstagioBloco" DROP CONSTRAINT "EstagioBloco_campoId_fkey";

-- AlterTable
ALTER TABLE "EstagioBloco" DROP COLUMN "campoId",
DROP COLUMN "setor",
DROP COLUMN "vagas",
ADD COLUMN     "campoEstagioId" INTEGER,
ADD COLUMN     "numeroBloco" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "EstagioBlocoCampo" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "campoId" INTEGER NOT NULL,
    "ordem" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioBlocoCampo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioBlocoGrupo" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioBlocoGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstagioBlocoGrupoAluno" (
    "id" SERIAL NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioBlocoGrupoAluno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstagioBlocoCampo_blocoId_campoId_key" ON "EstagioBlocoCampo"("blocoId", "campoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioBlocoGrupo_blocoId_nome_key" ON "EstagioBlocoGrupo"("blocoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioBlocoGrupoAluno_grupoId_alunoId_key" ON "EstagioBlocoGrupoAluno"("grupoId", "alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "EstagioBloco_turmaId_numeroBloco_key" ON "EstagioBloco"("turmaId", "numeroBloco");

-- AddForeignKey
ALTER TABLE "EstagioBloco" ADD CONSTRAINT "EstagioBloco_campoEstagioId_fkey" FOREIGN KEY ("campoEstagioId") REFERENCES "CampoEstagio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioBlocoCampo" ADD CONSTRAINT "EstagioBlocoCampo_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioBlocoCampo" ADD CONSTRAINT "EstagioBlocoCampo_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "CampoEstagio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioBlocoGrupo" ADD CONSTRAINT "EstagioBlocoGrupo_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioBlocoGrupoAluno" ADD CONSTRAINT "EstagioBlocoGrupoAluno_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "EstagioBlocoGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioBlocoGrupoAluno" ADD CONSTRAINT "EstagioBlocoGrupoAluno_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
