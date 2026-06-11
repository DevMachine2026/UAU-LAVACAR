import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
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
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
            : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: true,
        serializers: {
          req(req) { return { method: req.method, url: req.url }; },
          res(res) { return { statusCode: res.statusCode }; },
        },
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [mailerConfig],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([{
        ttl: configService.get<number>('RATE_LIMIT_TTL') ?? 60_000, // ms — 60 segundos
        limit: configService.get<number>('RATE_LIMIT_MAX') ?? 5,
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
