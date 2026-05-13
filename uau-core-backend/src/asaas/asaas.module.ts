import { Module } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';
import { BillingModule } from '../billing/billing.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [BillingModule, SubscriptionsModule],
  controllers: [AsaasController],
  providers: [AsaasService],
})
export class AsaasModule {}
