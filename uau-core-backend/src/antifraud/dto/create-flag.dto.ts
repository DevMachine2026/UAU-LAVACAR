import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AntiFraudFlagSeverity } from '@prisma/client';

export class CreateFlagDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  type: string; // Ex: ABNORMAL_ATTENDANCE_VOLUME, FAKE_LOCATION, MULTIPLE_DEVICES

  @IsEnum(AntiFraudFlagSeverity)
  @IsOptional()
  severity?: AntiFraudFlagSeverity;

  @IsString()
  @IsOptional()
  reason?: string;
}
