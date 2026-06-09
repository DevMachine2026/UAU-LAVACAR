import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { validate } from './config/env.validation';
import mailerConfig from './config/mailer.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminSettingsModule } from './admin-settings/admin-settings.module';
import { StatesModule } from './states/states.module';
import { CitiesModule } from './cities/cities.module';
import { FranchiseUnitsModule } from './franchise-units/franchise-units.module';
import { VehicleSizesModule } from './vehicle-sizes/vehicle-sizes.module';
import { PlansModule } from './plans/plans.module';
import { PartnersModule } from './partners/partners.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CustomersModule } from './customers/customers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CheckoutModule } from './checkout/checkout.module';
import { BillingModule } from './billing/billing.module';
import { WalletModule } from './wallet/wallet.module';
import { AsaasModule } from './asaas/asaas.module';
import { OperationsModule } from './operations/operations.module';
import { AnprModule } from './anpr/anpr.module';
import { FinancialModule } from './financial/financial.module';
import { AntifraudModule } from './antifraud/antifraud.module';
import { ReferralsModule } from './referrals/referrals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { FranchiseDashboardModule } from './franchise-dashboard/franchise-dashboard.module';
import { PartnerDashboardModule } from './partner-dashboard/partner-dashboard.module';
import { MailerModule } from './third-party/mailer.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [mailerConfig],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ([{
        ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
      }]),
    }),
    MailerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminSettingsModule,
    StatesModule,
    CitiesModule,
    FranchiseUnitsModule,
    VehicleSizesModule,
    PlansModule,
    PartnersModule,
    CampaignsModule,
    CustomersModule,
    VehiclesModule,
    SubscriptionsModule,
    CheckoutModule,
    BillingModule,
    WalletModule,
    AsaasModule,
    OperationsModule,
    AnprModule,
    FinancialModule,
    AntifraudModule,
    ReferralsModule,
    NotificationsModule,
    AdminDashboardModule,
    FranchiseDashboardModule,
    PartnerDashboardModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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
