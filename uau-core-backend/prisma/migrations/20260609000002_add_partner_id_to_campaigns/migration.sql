-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "partnerId" TEXT;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
