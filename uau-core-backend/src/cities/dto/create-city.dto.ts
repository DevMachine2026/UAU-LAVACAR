import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  stateId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
