import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CloseShiftDto {
  @IsNumber()
  @IsNotEmpty()
  finalBalance: number;

  @IsString()
  @IsNotEmpty()
  notes: string;
}
