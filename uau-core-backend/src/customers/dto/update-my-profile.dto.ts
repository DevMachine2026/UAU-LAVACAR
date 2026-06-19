import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  phone?: string;
}
