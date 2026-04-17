-- AlterTable
ALTER TABLE "OfertaAcademica" ADD COLUMN     "instrutorId" INTEGER;

-- AddForeignKey
ALTER TABLE "OfertaAcademica" ADD CONSTRAINT "OfertaAcademica_instrutorId_fkey" FOREIGN KEY ("instrutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
