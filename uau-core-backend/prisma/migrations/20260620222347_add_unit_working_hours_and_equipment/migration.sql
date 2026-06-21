-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "unit_working_hours" (
    "id" TEXT NOT NULL,
    "franchiseUnitId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "unit_working_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_equipments" (
    "id" TEXT NOT NULL,
    "franchiseUnitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unit_working_hours_franchiseUnitId_idx" ON "unit_working_hours"("franchiseUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_working_hours_franchiseUnitId_dayOfWeek_key" ON "unit_working_hours"("franchiseUnitId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "unit_equipments_franchiseUnitId_idx" ON "unit_equipments"("franchiseUnitId");

-- AddForeignKey
ALTER TABLE "unit_working_hours" ADD CONSTRAINT "unit_working_hours_franchiseUnitId_fkey" FOREIGN KEY ("franchiseUnitId") REFERENCES "franchise_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_equipments" ADD CONSTRAINT "unit_equipments_franchiseUnitId_fkey" FOREIGN KEY ("franchiseUnitId") REFERENCES "franchise_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
