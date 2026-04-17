-- CreateEnum
CREATE TYPE "InformativoPrioridade" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "InformativoStatus" AS ENUM ('RASCUNHO', 'PUBLICADO', 'INATIVO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "InformativoPublicoRole" AS ENUM ('ALUNO', 'INSTRUTOR', 'COORDENACAO', 'PEDAGOGICO', 'ADMIN', 'COMERCIAL', 'SECRETARIA');

-- CreateTable
CREATE TABLE "Informativo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" "InformativoPrioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "InformativoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "dataPublicacao" TIMESTAMP(3),
    "dataExpiracao" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Informativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformativoPublico" (
    "id" SERIAL NOT NULL,
    "informativoId" INTEGER NOT NULL,
    "role" "InformativoPublicoRole" NOT NULL,

    CONSTRAINT "InformativoPublico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformativoCurso" (
    "id" SERIAL NOT NULL,
    "informativoId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,

    CONSTRAINT "InformativoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformativoTurma" (
    "id" SERIAL NOT NULL,
    "informativoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,

    CONSTRAINT "InformativoTurma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformativoDestinatario" (
    "id" SERIAL NOT NULL,
    "informativoId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "InformativoDestinatario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Informativo_status_idx" ON "Informativo"("status");

-- CreateIndex
CREATE INDEX "Informativo_prioridade_idx" ON "Informativo"("prioridade");

-- CreateIndex
CREATE INDEX "Informativo_dataPublicacao_idx" ON "Informativo"("dataPublicacao");

-- CreateIndex
CREATE INDEX "Informativo_dataExpiracao_idx" ON "Informativo"("dataExpiracao");

-- CreateIndex
CREATE INDEX "Informativo_createdById_idx" ON "Informativo"("createdById");

-- CreateIndex
CREATE INDEX "InformativoPublico_role_idx" ON "InformativoPublico"("role");

-- CreateIndex
CREATE UNIQUE INDEX "InformativoPublico_informativoId_role_key" ON "InformativoPublico"("informativoId", "role");

-- CreateIndex
CREATE INDEX "InformativoCurso_cursoId_idx" ON "InformativoCurso"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "InformativoCurso_informativoId_cursoId_key" ON "InformativoCurso"("informativoId", "cursoId");

-- CreateIndex
CREATE INDEX "InformativoTurma_turmaId_idx" ON "InformativoTurma"("turmaId");

-- CreateIndex
CREATE UNIQUE INDEX "InformativoTurma_informativoId_turmaId_key" ON "InformativoTurma"("informativoId", "turmaId");

-- CreateIndex
CREATE INDEX "InformativoDestinatario_userId_idx" ON "InformativoDestinatario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InformativoDestinatario_informativoId_userId_key" ON "InformativoDestinatario"("informativoId", "userId");

-- AddForeignKey
ALTER TABLE "Informativo" ADD CONSTRAINT "Informativo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoPublico" ADD CONSTRAINT "InformativoPublico_informativoId_fkey" FOREIGN KEY ("informativoId") REFERENCES "Informativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoCurso" ADD CONSTRAINT "InformativoCurso_informativoId_fkey" FOREIGN KEY ("informativoId") REFERENCES "Informativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoCurso" ADD CONSTRAINT "InformativoCurso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoTurma" ADD CONSTRAINT "InformativoTurma_informativoId_fkey" FOREIGN KEY ("informativoId") REFERENCES "Informativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoTurma" ADD CONSTRAINT "InformativoTurma_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoDestinatario" ADD CONSTRAINT "InformativoDestinatario_informativoId_fkey" FOREIGN KEY ("informativoId") REFERENCES "Informativo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformativoDestinatario" ADD CONSTRAINT "InformativoDestinatario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
