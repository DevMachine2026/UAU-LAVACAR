import { PartialType } from '@nestjs/swagger';
import { CreateVehicleSizeDto } from './create-vehicle-size.dto';

export class UpdateVehicleSizeDto extends PartialType(CreateVehicleSizeDto) {}
