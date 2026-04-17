-- AlterTable
ALTER TABLE "User" ADD COLUMN     "turmaId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE SET NULL ON UPDATE CASCADE;
