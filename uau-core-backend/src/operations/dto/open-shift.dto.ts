import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class OpenShiftDto {
  @IsString()
  @IsNotEmpty()
  franchiseUnitId: string;

  @IsString()
  @IsNotEmpty()
  operatorId: string; // ID do usuário que está operando o caixa

  @IsNumber()
  @IsOptional()
  initialBalance?: number;
}
