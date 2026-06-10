-- CreateIndex
CREATE INDEX "anpr_cameras_unitId_idx" ON "anpr_cameras"("unitId");

-- CreateIndex
CREATE INDEX "anpr_cameras_isActive_idx" ON "anpr_cameras"("isActive");

-- CreateIndex
CREATE INDEX "anpr_events_unitId_idx" ON "anpr_events"("unitId");

-- CreateIndex
CREATE INDEX "anpr_events_cameraId_idx" ON "anpr_events"("cameraId");

-- CreateIndex
CREATE INDEX "anpr_events_plate_idx" ON "anpr_events"("plate");

-- CreateIndex
CREATE INDEX "anpr_events_status_idx" ON "anpr_events"("status");

-- CreateIndex
CREATE INDEX "anpr_events_capturedAt_idx" ON "anpr_events"("capturedAt");

-- CreateIndex
CREATE INDEX "anti_fraud_flags_userId_idx" ON "anti_fraud_flags"("userId");

-- CreateIndex
CREATE INDEX "anti_fraud_flags_status_idx" ON "anti_fraud_flags"("status");

-- CreateIndex
CREATE INDEX "anti_fraud_flags_severity_idx" ON "anti_fraud_flags"("severity");

-- CreateIndex
CREATE INDEX "anti_fraud_flags_createdAt_idx" ON "anti_fraud_flags"("createdAt");

-- CreateIndex
CREATE INDEX "attendances_shiftId_idx" ON "attendances"("shiftId");

-- CreateIndex
CREATE INDEX "attendances_customerId_idx" ON "attendances"("customerId");

-- CreateIndex
CREATE INDEX "attendances_vehicleId_idx" ON "attendances"("vehicleId");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_plate_idx" ON "attendances"("plate");

-- CreateIndex
CREATE INDEX "attendances_createdAt_idx" ON "attendances"("createdAt");

-- CreateIndex
CREATE INDEX "billing_history_customerId_idx" ON "billing_history"("customerId");

-- CreateIndex
CREATE INDEX "billing_history_subscriptionId_idx" ON "billing_history"("subscriptionId");

-- CreateIndex
CREATE INDEX "billing_history_status_idx" ON "billing_history"("status");

-- CreateIndex
CREATE INDEX "billing_history_createdAt_idx" ON "billing_history"("createdAt");

-- CreateIndex
CREATE INDEX "campaigns_isActive_idx" ON "campaigns"("isActive");

-- CreateIndex
CREATE INDEX "cities_stateId_idx" ON "cities"("stateId");

-- CreateIndex
CREATE INDEX "cities_isActive_idx" ON "cities"("isActive");

-- CreateIndex
CREATE INDEX "financial_ledger_unitId_idx" ON "financial_ledger"("unitId");

-- CreateIndex
CREATE INDEX "financial_ledger_partnerId_idx" ON "financial_ledger"("partnerId");

-- CreateIndex
CREATE INDEX "financial_ledger_userId_idx" ON "financial_ledger"("userId");

-- CreateIndex
CREATE INDEX "financial_ledger_createdAt_idx" ON "financial_ledger"("createdAt");

-- CreateIndex
CREATE INDEX "franchise_reports_unitId_idx" ON "franchise_reports"("unitId");

-- CreateIndex
CREATE INDEX "franchise_reports_status_idx" ON "franchise_reports"("status");

-- CreateIndex
CREATE INDEX "franchise_reports_createdAt_idx" ON "franchise_reports"("createdAt");

-- CreateIndex
CREATE INDEX "franchise_units_stateId_idx" ON "franchise_units"("stateId");

-- CreateIndex
CREATE INDEX "franchise_units_cityId_idx" ON "franchise_units"("cityId");

-- CreateIndex
CREATE INDEX "franchise_units_isActive_idx" ON "franchise_units"("isActive");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "partner_transactions_customerId_idx" ON "partner_transactions"("customerId");

-- CreateIndex
CREATE INDEX "partner_transactions_status_idx" ON "partner_transactions"("status");

-- CreateIndex
CREATE INDEX "partner_transactions_createdAt_idx" ON "partner_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "partners_stateId_idx" ON "partners"("stateId");

-- CreateIndex
CREATE INDEX "partners_cityId_idx" ON "partners"("cityId");

-- CreateIndex
CREATE INDEX "partners_unitId_idx" ON "partners"("unitId");

-- CreateIndex
CREATE INDEX "partners_ownerUserId_idx" ON "partners"("ownerUserId");

-- CreateIndex
CREATE INDEX "partners_isActive_idx" ON "partners"("isActive");

-- CreateIndex
CREATE INDEX "plan_availabilities_planId_idx" ON "plan_availabilities"("planId");

-- CreateIndex
CREATE INDEX "plan_availabilities_stateId_idx" ON "plan_availabilities"("stateId");

-- CreateIndex
CREATE INDEX "plan_availabilities_cityId_idx" ON "plan_availabilities"("cityId");

-- CreateIndex
CREATE INDEX "plan_availabilities_unitId_idx" ON "plan_availabilities"("unitId");

-- CreateIndex
CREATE INDEX "plan_availabilities_isActive_idx" ON "plan_availabilities"("isActive");

-- CreateIndex
CREATE INDEX "plan_vehicle_size_prices_sizeCategoryId_idx" ON "plan_vehicle_size_prices"("sizeCategoryId");

-- CreateIndex
CREATE INDEX "plan_vehicle_size_prices_isActive_idx" ON "plan_vehicle_size_prices"("isActive");

-- CreateIndex
CREATE INDEX "plans_isActive_idx" ON "plans"("isActive");

-- CreateIndex
CREATE INDEX "plans_coverageType_idx" ON "plans"("coverageType");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

-- CreateIndex
CREATE INDEX "security_logs_userId_idx" ON "security_logs"("userId");

-- CreateIndex
CREATE INDEX "security_logs_event_idx" ON "security_logs"("event");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");

-- CreateIndex
CREATE INDEX "shifts_unitId_idx" ON "shifts"("unitId");

-- CreateIndex
CREATE INDEX "shifts_operatorId_idx" ON "shifts"("operatorId");

-- CreateIndex
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

-- CreateIndex
CREATE INDEX "shifts_createdAt_idx" ON "shifts"("createdAt");

-- CreateIndex
CREATE INDEX "subscriptions_customerId_idx" ON "subscriptions"("customerId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_customerId_status_idx" ON "subscriptions"("customerId", "status");

-- CreateIndex
CREATE INDEX "unit_staff_userId_idx" ON "unit_staff"("userId");

-- CreateIndex
CREATE INDEX "unit_staff_isActive_idx" ON "unit_staff"("isActive");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_defaultUnitId_idx" ON "users"("defaultUnitId");

-- CreateIndex
CREATE INDEX "vehicle_model_size_rules_sizeCategoryId_idx" ON "vehicle_model_size_rules"("sizeCategoryId");

-- CreateIndex
CREATE INDEX "vehicle_model_size_rules_isActive_idx" ON "vehicle_model_size_rules"("isActive");

-- CreateIndex
CREATE INDEX "vehicle_size_categories_isActive_idx" ON "vehicle_size_categories"("isActive");

-- CreateIndex
CREATE INDEX "vehicles_customerId_idx" ON "vehicles"("customerId");

-- CreateIndex
CREATE INDEX "vehicles_sizeCategoryId_idx" ON "vehicles"("sizeCategoryId");

-- CreateIndex
CREATE INDEX "vehicles_isActive_idx" ON "vehicles"("isActive");

-- CreateIndex
CREATE INDEX "wallet_movements_walletId_idx" ON "wallet_movements"("walletId");

-- CreateIndex
CREATE INDEX "wallet_movements_type_idx" ON "wallet_movements"("type");

-- CreateIndex
CREATE INDEX "wallet_movements_createdAt_idx" ON "wallet_movements"("createdAt");
