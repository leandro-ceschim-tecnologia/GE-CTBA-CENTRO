/*
  Warnings:

  - You are about to drop the column `campoEstagioId` on the `EstagioBloco` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[matricula]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "EstagioBloco" DROP CONSTRAINT "EstagioBloco_campoEstagioId_fkey";

-- AlterTable
ALTER TABLE "EstagioBloco" DROP COLUMN "campoEstagioId";

-- AlterTable
ALTER TABLE "EstagioBlocoGrupo" ADD COLUMN     "fixo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fone1" TEXT,
ADD COLUMN     "fone2" TEXT,
ADD COLUMN     "matricula" TEXT;

-- CreateTable
CREATE TABLE "EstagioRotacao" (
    "id" SERIAL NOT NULL,
    "blocoId" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "campoId" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "ordem" INTEGER NOT NULL,
    "fixo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstagioRotacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstagioRotacao_blocoId_ordem_idx" ON "EstagioRotacao"("blocoId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "User_matricula_key" ON "User"("matricula");

-- AddForeignKey
ALTER TABLE "EstagioRotacao" ADD CONSTRAINT "EstagioRotacao_blocoId_fkey" FOREIGN KEY ("blocoId") REFERENCES "EstagioBloco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioRotacao" ADD CONSTRAINT "EstagioRotacao_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "EstagioBlocoGrupo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstagioRotacao" ADD CONSTRAINT "EstagioRotacao_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "CampoEstagio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
