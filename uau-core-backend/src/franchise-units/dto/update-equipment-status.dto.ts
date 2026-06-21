import { IsEnum } from 'class-validator';
import { EquipmentStatus } from '@prisma/client';

export class UpdateEquipmentStatusDto {
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;
}
