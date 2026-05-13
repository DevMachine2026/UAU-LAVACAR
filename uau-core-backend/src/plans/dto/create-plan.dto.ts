import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { CoverageType } from '@prisma/client';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsBoolean()
  @IsOptional()
  useVehicleSizePricing?: boolean;

  @IsEnum(CoverageType)
  @IsOptional()
  coverageType?: CoverageType;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedDays?: string[];

  @IsString()
  @IsOptional()
  allowedStartTime?: string;

  @IsString()
  @IsOptional()
  allowedEndTime?: string;

  @IsBoolean()
  @IsOptional()
  allowAllDays?: boolean;

  @IsNumber()
  @IsOptional()
  maxVehicles?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
