import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsNumber()
  @IsOptional()
  recurringAmount?: number;

  @IsNumber()
  @IsOptional()
  firstChargeAmount?: number;
}
