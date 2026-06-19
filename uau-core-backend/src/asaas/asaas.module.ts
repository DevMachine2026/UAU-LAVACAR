import { Module } from '@nestjs/common';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';

@Module({
  imports: [AdminSettingsModule],
  controllers: [AsaasController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}
