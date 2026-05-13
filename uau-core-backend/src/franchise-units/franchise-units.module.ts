import { Module } from '@nestjs/common';
import { FranchiseUnitsService } from './franchise-units.service';
import { FranchiseUnitsController } from './franchise-units.controller';

@Module({
  controllers: [FranchiseUnitsController],
  providers: [FranchiseUnitsService],
})
export class FranchiseUnitsModule {}
