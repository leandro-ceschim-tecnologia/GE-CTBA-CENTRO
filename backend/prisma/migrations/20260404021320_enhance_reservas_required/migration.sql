/*
  Warnings:

  - Made the column `data` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `horarioFim` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `horarioInicio` on table `Reserva` required. This step will fail if there are existing NULL values in that column.
  - Made the column `turno` on table `Reserva` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Reserva" ALTER COLUMN "data" SET NOT NULL,
ALTER COLUMN "horarioFim" SET NOT NULL,
ALTER COLUMN "horarioInicio" SET NOT NULL,
ALTER COLUMN "turno" SET NOT NULL;
