import { Module } from '@nestjs/common';
import { VehicleSizesService } from './vehicle-sizes.service';
import { VehicleSizesController } from './vehicle-sizes.controller';

@Module({
  controllers: [VehicleSizesController],
  providers: [VehicleSizesService],
  exports: [VehicleSizesService],
})
export class VehicleSizesModule {}
