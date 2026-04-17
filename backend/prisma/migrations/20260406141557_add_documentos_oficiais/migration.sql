-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DECLARACAO', 'OFICIO', 'REQUERIMENTO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('ATIVO', 'CANCELADO');

-- CreateTable
CREATE TABLE "DocumentoTemplate" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoEmitido" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "status" "StatusDocumento" NOT NULL DEFAULT 'ATIVO',
    "templateId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "assunto" TEXT,
    "nomeSolicitante" TEXT,
    "cpfSolicitante" TEXT,
    "matricula" TEXT,
    "curso" TEXT,
    "turma" TEXT,
    "destinatario" TEXT,
    "cargoDestinatario" TEXT,
    "instituicaoDestino" TEXT,
    "variaveis" JSONB,
    "arquivoGerado" TEXT,
    "observacoes" TEXT,
    "emitidoPorId" INTEGER,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoEmitido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoTemplate_tipo_ativo_idx" ON "DocumentoTemplate"("tipo", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoEmitido_numero_key" ON "DocumentoEmitido"("numero");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_tipo_idx" ON "DocumentoEmitido"("tipo");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_status_idx" ON "DocumentoEmitido"("status");

-- CreateIndex
CREATE INDEX "DocumentoEmitido_dataEmissao_idx" ON "DocumentoEmitido"("dataEmissao");

-- AddForeignKey
ALTER TABLE "DocumentoEmitido" ADD CONSTRAINT "DocumentoEmitido_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentoTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoEmitido" ADD CONSTRAINT "DocumentoEmitido_emitidoPorId_fkey" FOREIGN KEY ("emitidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
