-- AlterTable
ALTER TABLE "CampoEstagio" ADD COLUMN     "supervisorId" INTEGER;

-- AddForeignKey
ALTER TABLE "CampoEstagio" ADD CONSTRAINT "CampoEstagio_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
