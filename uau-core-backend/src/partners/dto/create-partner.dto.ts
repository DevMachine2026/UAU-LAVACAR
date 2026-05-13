import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  document?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty()
  stateId: string;

  @IsString()
  @IsNotEmpty()
  cityId: string;

  @IsString()
  @IsOptional()
  unitId?: string;

  @IsNumber()
  @IsOptional()
  generatedCashbackPercent?: number;

  @IsNumber()
  @IsOptional()
  customerCashbackPercent?: number;

  @IsNumber()
  @IsOptional()
  uauCommissionPercent?: number;

  @IsNumber()
  @IsOptional()
  acceptedCashbackLimitPercent?: number;
}
