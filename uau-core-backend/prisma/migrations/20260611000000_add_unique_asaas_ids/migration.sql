-- Add unique constraints to asaasId fields to enable idempotent webhook lookups.
-- WARNING: This migration will fail if duplicate asaasId values exist in either table.
-- Run the following checks before deploying:
--   SELECT asaasId, COUNT(*) FROM billing_history WHERE asaasId IS NOT NULL GROUP BY asaasId HAVING COUNT(*) > 1;
--   SELECT asaasId, COUNT(*) FROM subscriptions WHERE asaasId IS NOT NULL GROUP BY asaasId HAVING COUNT(*) > 1;

-- CreateIndex
CREATE UNIQUE INDEX "billing_history_asaasId_key" ON "billing_history"("asaasId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_asaasId_key" ON "subscriptions"("asaasId");
