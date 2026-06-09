import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehicleSizePriceDto {
  @ApiPropertyOptional({ description: 'Novo preço para este porte', example: 59.90 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
