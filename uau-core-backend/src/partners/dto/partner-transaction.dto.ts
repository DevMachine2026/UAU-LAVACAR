import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartnerTransactionDto {
  @ApiPropertyOptional({ description: 'userId do cliente (quando parceiro inicia a transação)' })
  @IsString()
  @IsOptional()
  customerUserId?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  grossAmount: number;

  @ApiProperty({ example: 20.0, description: 'Cashback da wallet a ser utilizado' })
  @IsNumber()
  @Min(0)
  cashbackToUse: number;

  @ApiProperty({ enum: ['PIX', 'CREDIT_CARD'] })
  @IsEnum(['PIX', 'CREDIT_CARD'])
  paymentMethod: 'PIX' | 'CREDIT_CARD';
}

export class PartnerQrDto {
  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  grossAmount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  customerUserId?: string;
}
