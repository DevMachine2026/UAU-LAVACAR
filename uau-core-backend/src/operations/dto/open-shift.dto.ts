import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class OpenShiftReadingDto {
  @IsString()
  fieldId: string;

  @IsNumber()
  openingValue: number;
}

export class OpenShiftDto {
  @IsString()
  unitId: string;

  @IsOptional()
  @IsArray()
  openingReadings?: OpenShiftReadingDto[];

  @IsOptional()
  @IsString()
  openingNotes?: string;
}
