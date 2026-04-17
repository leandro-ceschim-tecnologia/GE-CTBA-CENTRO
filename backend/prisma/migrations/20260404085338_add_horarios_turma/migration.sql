-- AlterTable
ALTER TABLE "Turma" ADD COLUMN     "horarioSabadoFim" TEXT,
ADD COLUMN     "horarioSabadoInicio" TEXT,
ADD COLUMN     "horarioSemanaFim" TEXT,
ADD COLUMN     "horarioSemanaInicio" TEXT,
ADD COLUMN     "sabadoIntegral" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipoHorario" TEXT;
