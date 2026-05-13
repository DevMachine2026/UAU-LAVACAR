import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // Para integração com Asaas
}
