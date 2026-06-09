import { IsObject, IsNotEmpty } from 'class-validator';

export class BulkUpdateAdminSettingDto {
  @IsObject()
  @IsNotEmpty()
  settings: Record<string, string>;
}
