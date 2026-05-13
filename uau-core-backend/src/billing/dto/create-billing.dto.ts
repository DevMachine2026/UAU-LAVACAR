import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { BillingStatus } from '@prisma/client';

export class CreateBillingDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  asaasId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(BillingStatus)
  @IsOptional()
  status?: BillingStatus;

  @IsString()
  @IsOptional()
  description?: string;
}
