import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { WalletMovementOrigin, WalletMovementType } from '@prisma/client';

export class CreateMovementDto {
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @IsEnum(WalletMovementType)
  @IsNotEmpty()
  type: WalletMovementType;

  @IsEnum(WalletMovementOrigin)
  @IsNotEmpty()
  origin: WalletMovementOrigin;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}
