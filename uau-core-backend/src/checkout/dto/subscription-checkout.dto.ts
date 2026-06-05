import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum CheckoutPaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
}

export class SubscriptionCheckoutDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @IsEnum(CheckoutPaymentMethod)
  paymentMethod: CheckoutPaymentMethod;

  @IsString()
  @IsOptional()
  stateId?: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  unitId?: string;
}
