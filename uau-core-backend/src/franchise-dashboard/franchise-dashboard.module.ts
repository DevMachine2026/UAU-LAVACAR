import { Module } from '@nestjs/common';
import { FranchiseDashboardController } from './franchise-dashboard.controller';
import { FranchiseDashboardService } from './franchise-dashboard.service';

@Module({
  controllers: [FranchiseDashboardController],
  providers: [FranchiseDashboardService],
})
export class FranchiseDashboardModule {}
