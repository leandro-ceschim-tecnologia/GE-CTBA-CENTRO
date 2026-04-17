-- AlterTable
ALTER TABLE "Reserva" ADD COLUMN     "data" TIMESTAMP(3),
ADD COLUMN     "horarioFim" TEXT,
ADD COLUMN     "horarioInicio" TEXT,
ADD COLUMN     "origem" TEXT DEFAULT 'cronograma',
ADD COLUMN     "turno" TEXT;
