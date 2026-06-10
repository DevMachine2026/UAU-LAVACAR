import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVehicleSizePriceDto } from './create-vehicle-size-price.dto';

// sizeCategoryId is intentionally excluded — a price entry cannot be re-pointed
// to a different size category after creation; create a new entry instead.
export class UpdateVehicleSizePriceDto extends PartialType(
  OmitType(CreateVehicleSizePriceDto, ['sizeCategoryId'] as const),
) {}
