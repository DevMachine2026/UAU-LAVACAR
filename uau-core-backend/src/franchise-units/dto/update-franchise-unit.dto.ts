import { PartialType } from '@nestjs/swagger';
import { CreateFranchiseUnitDto } from './create-franchise-unit.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFranchiseUnitDto extends PartialType(CreateFranchiseUnitDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
