-- CreateEnum
CREATE TYPE "PlanPeriodicity" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY');

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "periodicity" "PlanPeriodicity" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "vehicleId" TEXT;

-- CreateIndex
CREATE INDEX "subscriptions_vehicleId_idx" ON "subscriptions"("vehicleId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
