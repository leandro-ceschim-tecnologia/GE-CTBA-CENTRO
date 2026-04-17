-- CreateTable
CREATE TABLE "Recesso" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "aplicaTodosCursos" BOOLEAN NOT NULL DEFAULT true,
    "cursoId" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronogramaAula" (
    "id" SERIAL NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "turmaDisciplinaId" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "numeroEncontroGeral" INTEGER NOT NULL,
    "numeroEncontroDisciplina" INTEGER NOT NULL,
    "tipoAula" TEXT NOT NULL DEFAULT 'Aula',
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planejada',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronogramaAula_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recesso" ADD CONSTRAINT "Recesso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronogramaAula" ADD CONSTRAINT "CronogramaAula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronogramaAula" ADD CONSTRAINT "CronogramaAula_turmaDisciplinaId_fkey" FOREIGN KEY ("turmaDisciplinaId") REFERENCES "TurmaDisciplina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
