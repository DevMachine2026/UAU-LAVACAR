// uau-core-backend/src/financial/dto/update-franchise-rule.dto.ts
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateFranchiseRuleDto {
  @IsOptional()
  @IsNumber()
  franchiseRevenuePercent?: number;

  @IsOptional()
  @IsNumber()
  uauRoyaltyPercent?: number;

  @IsOptional()
  @IsNumber()
  marketingFundPercent?: number;

  // Campos legados aceitos por compatibilidade
  @IsOptional()
  @IsNumber()
  repassePercent?: number;

  @IsOptional()
  @IsNumber()
  royaltyPercent?: number;

  @IsOptional()
  @IsNumber()
  marketingPercent?: number;
}
