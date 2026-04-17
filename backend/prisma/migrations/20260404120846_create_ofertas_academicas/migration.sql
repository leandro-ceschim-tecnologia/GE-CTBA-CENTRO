-- CreateEnum
CREATE TYPE "OfertaTipo" AS ENUM ('CURSO_INTENSIVO', 'PALESTRA', 'WORKSHOP', 'TREINAMENTO', 'MINICURSO', 'EVENTO', 'SEGUNDA_CHAMADA_RECUPERACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "OfertaStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "OfertaPublicoRole" AS ENUM ('ALUNO', 'INSTRUTOR', 'COMERCIAL', 'SECRETARIA', 'COORDENACAO', 'PEDAGOGICO', 'ADMIN');

-- CreateEnum
CREATE TYPE "OfertaInscricaoStatus" AS ENUM ('INSCRITO', 'CANCELADO', 'PRESENTE', 'AUSENTE', 'LISTA_ESPERA');

-- CreateTable
CREATE TABLE "OfertaAcademica" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" "OfertaTipo" NOT NULL,
    "descricao" TEXT,
    "observacoes" TEXT,
    "local" TEXT,
    "dataEvento" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "inicioInscricoes" TIMESTAMP(3),
    "fimInscricoes" TIMESTAMP(3),
    "vagas" INTEGER,
    "permiteInscricao" BOOLEAN NOT NULL DEFAULT true,
    "possuiCertificacao" BOOLEAN NOT NULL DEFAULT false,
    "status" "OfertaStatus" NOT NULL DEFAULT 'RASCUNHO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaAcademica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaPublicoAlvo" (
    "id" SERIAL NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "role" "OfertaPublicoRole" NOT NULL,

    CONSTRAINT "OfertaPublicoAlvo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaInscricao" (
    "id" SERIAL NOT NULL,
    "ofertaId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "OfertaInscricaoStatus" NOT NULL DEFAULT 'INSCRITO',
    "presenca" BOOLEAN,
    "observacoes" TEXT,
    "certificadoEmitido" BOOLEAN NOT NULL DEFAULT false,
    "dataInscricao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaInscricao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfertaAcademica_status_idx" ON "OfertaAcademica"("status");

-- CreateIndex
CREATE INDEX "OfertaAcademica_tipo_idx" ON "OfertaAcademica"("tipo");

-- CreateIndex
CREATE INDEX "OfertaAcademica_dataEvento_idx" ON "OfertaAcademica"("dataEvento");

-- CreateIndex
CREATE INDEX "OfertaAcademica_ativo_idx" ON "OfertaAcademica"("ativo");

-- CreateIndex
CREATE INDEX "OfertaPublicoAlvo_role_idx" ON "OfertaPublicoAlvo"("role");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaPublicoAlvo_ofertaId_role_key" ON "OfertaPublicoAlvo"("ofertaId", "role");

-- CreateIndex
CREATE INDEX "OfertaInscricao_status_idx" ON "OfertaInscricao"("status");

-- CreateIndex
CREATE INDEX "OfertaInscricao_userId_idx" ON "OfertaInscricao"("userId");

-- CreateIndex
CREATE INDEX "OfertaInscricao_ofertaId_idx" ON "OfertaInscricao"("ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaInscricao_ofertaId_userId_key" ON "OfertaInscricao"("ofertaId", "userId");

-- AddForeignKey
ALTER TABLE "OfertaAcademica" ADD CONSTRAINT "OfertaAcademica_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaPublicoAlvo" ADD CONSTRAINT "OfertaPublicoAlvo_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaAcademica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaInscricao" ADD CONSTRAINT "OfertaInscricao_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaAcademica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaInscricao" ADD CONSTRAINT "OfertaInscricao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
