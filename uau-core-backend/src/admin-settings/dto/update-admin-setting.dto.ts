import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAdminSettingDto {
  @IsString()
  @IsNotEmpty()
  value: string;
}
