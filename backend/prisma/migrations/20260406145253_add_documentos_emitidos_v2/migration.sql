/*
  Warnings:

  - You are about to drop the column `arquivoGerado` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `cargoDestinatario` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `curso` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `dataEmissao` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `destinatario` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `emitidoPorId` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `instituicaoDestino` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `matricula` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `numero` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `turma` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the column `variaveis` on the `DocumentoEmitido` table. All the data in the column will be lost.
  - You are about to drop the `DocumentoTemplate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codigoDocumento]` on the table `DocumentoEmitido` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigoDocumento` to the `DocumentoEmitido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templatePath` to the `DocumentoEmitido` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DocumentoEmitido" DROP CONSTRAINT "DocumentoEmitido_emitidoPorId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentoEmitido" DROP CONSTRAINT "DocumentoEmitido_templateId_fkey";

-- DropIndex
DROP INDEX "DocumentoEmitido_dataEmissao_idx";

-- DropIndex
DROP INDEX "DocumentoEmitido_numero_key";

-- DropIndex
DROP INDEX "DocumentoEmitido_status_idx";

-- AlterTable
ALTER TABLE "DocumentoEmitido" DROP COLUMN "arquivoGerado",
DROP COLUMN "cargoDestinatario",
DROP COLUMN "curso",
DROP COLUMN "dataEmissao",
DROP COLUMN "destinatario",
DROP COLUMN "emitidoPorId",
DROP COLUMN "instituicaoDestino",
DROP COLUMN "matricula",
DROP COLUMN "numero",
DROP COLUMN "status",
DROP COLUMN "templateId",
DROP COLUMN "turma",
DROP COLUMN "variaveis",
ADD COLUMN     "cancelado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "codigoDocumento" TEXT NOT NULL,
ADD COLUMN     "cursoSolicitante" TEXT,
ADD COLUMN     "destinatarioCargo" TEXT,
ADD COLUMN     "destinatarioNome" TEXT,
ADD COLUMN     "destinatarioOrgao" TEXT,
ADD COLUMN     "docxUrl" TEXT,
ADD COLUMN     "emitidoEm" TIMESTAMP(3),
ADD COLUMN     "fone1Solicitante" TEXT,
ADD COLUMN     "fone2Solicitante" TEXT,
ADD COLUMN     "matriculaSolicitante" TEXT,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "templatePath" TEXT NOT NULL,
ADD COLUMN     "turmaSolicitante" TEXT,
ADD COLUMN     "userId" INTEGER,
ADD COLUMN     "variaveisTemplate" JSONB;

-- DropTable
DROP TABLE "DocumentoTemplate";

-- DropEnum
DROP TYPE "StatusDocumento";

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoEmitido_codigoDocumento_key" ON "DocumentoEmitido"("codigoDocumento");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_codigoDocumento_idx" ON "DocumentoEmitido"("codigoDocumento");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_cancelado_idx" ON "DocumentoEmitido"("cancelado");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_emitidoEm_idx" ON "DocumentoEmitido"("emitidoEm");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_userId_idx" ON "DocumentoEmitido"("userId");

-- AddForeignKey
ALTER TABLE "DocumentoEmitido" ADD CONSTRAINT "DocumentoEmitido_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
