-- AlterTable
ALTER TABLE "customers" ADD COLUMN "asaasCustomerId" TEXT;

-- AlterTable
ALTER TABLE "billing_history" ADD COLUMN "invoiceUrl" TEXT;
ALTER TABLE "billing_history" ADD COLUMN "pixQrCode" TEXT;
ALTER TABLE "billing_history" ADD COLUMN "pixCopyPaste" TEXT;
ALTER TABLE "billing_history" ADD COLUMN "bankSlipBarCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_asaasCustomerId_key" ON "customers"("asaasCustomerId");
