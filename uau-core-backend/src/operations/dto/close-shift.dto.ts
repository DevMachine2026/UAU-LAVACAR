import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CloseShiftReadingDto {
  @IsString()
  fieldId: string;

  @IsNumber()
  closingValue: number;
}

export class CloseShiftDto {
  @IsOptional()
  @IsArray()
  closingReadings?: CloseShiftReadingDto[];

  @IsOptional()
  @IsString()
  closingNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
