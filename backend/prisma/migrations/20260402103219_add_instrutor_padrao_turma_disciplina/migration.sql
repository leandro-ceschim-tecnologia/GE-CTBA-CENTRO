-- AlterTable
ALTER TABLE "TurmaDisciplina" ADD COLUMN     "instrutorPadraoId" INTEGER;

-- AddForeignKey
ALTER TABLE "TurmaDisciplina" ADD CONSTRAINT "TurmaDisciplina_instrutorPadraoId_fkey" FOREIGN KEY ("instrutorPadraoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
