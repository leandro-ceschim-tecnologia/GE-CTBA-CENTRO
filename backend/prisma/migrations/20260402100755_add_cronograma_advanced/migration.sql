-- AlterTable
ALTER TABLE "CronogramaAula" ADD COLUMN     "instrutorId" INTEGER;

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "cronogramaAulaId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "instrutorId" INTEGER,
    "tipo" TEXT NOT NULL,
    "recursoNome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CronogramaAula" ADD CONSTRAINT "CronogramaAula_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_cronogramaAulaId_fkey" FOREIGN KEY ("cronogramaAulaId") REFERENCES "CronogramaAula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
