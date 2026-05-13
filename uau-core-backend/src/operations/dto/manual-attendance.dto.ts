import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ManualAttendanceDto {
  @IsString()
  shiftId: string;

  @IsString()
  plate: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @IsNumber()
  cashbackUsed?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
