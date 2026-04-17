-- AlterTable
ALTER TABLE "Turma" ADD COLUMN     "dataInicio" TIMESTAMP(3),
ADD COLUMN     "datasPuladas" JSONB,
ADD COLUMN     "diasAula" JSONB;
