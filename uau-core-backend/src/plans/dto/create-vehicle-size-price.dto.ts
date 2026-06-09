import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleSizePriceDto {
  @ApiProperty({ description: 'ID da categoria de tamanho (VehicleSizeCategory)' })
  @IsString()
  @IsNotEmpty()
  sizeCategoryId: string;

  @ApiProperty({ description: 'Preço para este porte', example: 49.90 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
