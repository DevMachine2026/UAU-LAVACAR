import { Module } from '@nestjs/common';
import { AdminSettingsModule } from '../admin-settings/admin-settings.module';
import { WelcomeBonusCronService } from './welcome-bonus-cron.service';

@Module({
  imports: [AdminSettingsModule],
  providers: [WelcomeBonusCronService],
})
export class WelcomeBonusModule {}
