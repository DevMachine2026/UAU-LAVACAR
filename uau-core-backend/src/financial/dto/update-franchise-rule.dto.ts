import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFranchiseRuleDto {
  @IsNumber()
  @IsOptional()
  repassePercent?: number;

  @IsNumber()
  @IsOptional()
  royaltyPercent?: number;

  @IsNumber()
  @IsOptional()
  marketingPercent?: number;
}
