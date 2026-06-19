-- CreateEnum
CREATE TYPE "PurchasePaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD');

-- AlterTable
ALTER TABLE "billing_history" ADD COLUMN     "individualPurchaseId" TEXT;

-- CreateTable
CREATE TABLE "wash_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wash_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_service_purchases" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "originalAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(10,2) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PurchasePaymentMethod" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individual_service_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_service_purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "individual_service_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wash_services_isActive_idx" ON "wash_services"("isActive");

-- CreateIndex
CREATE INDEX "individual_service_purchases_customerId_idx" ON "individual_service_purchases"("customerId");

-- CreateIndex
CREATE INDEX "individual_service_purchases_vehicleId_idx" ON "individual_service_purchases"("vehicleId");

-- CreateIndex
CREATE INDEX "individual_service_purchases_status_idx" ON "individual_service_purchases"("status");

-- CreateIndex
CREATE INDEX "individual_service_purchases_createdAt_idx" ON "individual_service_purchases"("createdAt");

-- CreateIndex
CREATE INDEX "individual_service_purchase_items_purchaseId_idx" ON "individual_service_purchase_items"("purchaseId");

-- CreateIndex
CREATE INDEX "individual_service_purchase_items_serviceId_idx" ON "individual_service_purchase_items"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_history_individualPurchaseId_key" ON "billing_history"("individualPurchaseId");

-- AddForeignKey
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_individualPurchaseId_fkey" FOREIGN KEY ("individualPurchaseId") REFERENCES "individual_service_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_service_purchases" ADD CONSTRAINT "individual_service_purchases_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_service_purchases" ADD CONSTRAINT "individual_service_purchases_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_service_purchase_items" ADD CONSTRAINT "individual_service_purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "individual_service_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_service_purchase_items" ADD CONSTRAINT "individual_service_purchase_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "wash_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
