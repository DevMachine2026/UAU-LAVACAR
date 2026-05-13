import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLedgerEntryDto {
  @IsString()
  @IsOptional()
  unitId?: string;

  @IsString()
  @IsOptional()
  partnerId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  type: string; // CREDIT / DEBIT

  @IsString()
  @IsNotEmpty()
  origin: string; // ROYALTIES / REPASSE / RECARGA / CASHBACK

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  referenceId?: string; // ID da transação original (ex: pagamento Asaas)
}
