import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { StatesModule } from './states/states.module';
import { FranchiseUnitsModule } from './franchise-units/franchise-units.module';
import { VehicleSizesModule } from './vehicle-sizes/vehicle-sizes.module';
import { PlansModule } from './plans/plans.module';
import { PartnersModule } from './partners/partners.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BillingModule } from './billing/billing.module';
import { WalletModule } from './wallet/wallet.module';
import { AsaasModule } from './asaas/asaas.module';
import { OperationsModule } from './operations/operations.module';
import { AnprModule } from './anpr/anpr.module';
import { FinancialModule } from './financial/financial.module';
import { AntifraudModule } from './antifraud/antifraud.module';
import { ReferralsModule } from './referrals/referrals.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminSettingsModule,
    StatesModule,
    FranchiseUnitsModule,
    VehicleSizesModule,
    PlansModule,
    PartnersModule,
    CampaignsModule,
    CustomersModule,
    VehiclesModule,
    SubscriptionsModule,
    BillingModule,
    WalletModule,
    AsaasModule,
    OperationsModule,
    AnprModule,
    FinancialModule,
    AntifraudModule,
    ReferralsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
