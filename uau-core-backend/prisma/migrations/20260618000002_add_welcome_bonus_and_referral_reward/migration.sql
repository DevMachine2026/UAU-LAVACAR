-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "WalletMovementOrigin" ADD VALUE 'WELCOME_BONUS';
ALTER TYPE "WalletMovementOrigin" ADD VALUE 'REFERRAL_BONUS';

-- AlterTable
ALTER TABLE "referrals" ADD COLUMN     "rewardGranted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "welcomeBonusBalance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "welcome_bonus_grants" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullyExpiredAt" TIMESTAMP(3),

    CONSTRAINT "welcome_bonus_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "welcome_bonus_grants_cpf_key" ON "welcome_bonus_grants"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "welcome_bonus_grants_walletId_key" ON "welcome_bonus_grants"("walletId");

-- AddForeignKey
ALTER TABLE "welcome_bonus_grants" ADD CONSTRAINT "welcome_bonus_grants_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
