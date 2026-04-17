/*
  Warnings:

  - A unique constraint covering the columns `[codigoCertificado]` on the table `OfertaInscricao` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OfertaAcademica" ADD COLUMN     "cargaHoraria" INTEGER,
ADD COLUMN     "certificadoAtivo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "temaCertificado" TEXT,
ADD COLUMN     "templateCertificadoPath" TEXT;

-- AlterTable
ALTER TABLE "OfertaInscricao" ADD COLUMN     "certificadoEmitidoEm" TIMESTAMP(3),
ADD COLUMN     "certificadoRevogado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "certificadoUrl" TEXT,
ADD COLUMN     "certificadoVersao" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "codigoCertificado" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cpf" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "OfertaInscricao_codigoCertificado_key" ON "OfertaInscricao"("codigoCertificado");
