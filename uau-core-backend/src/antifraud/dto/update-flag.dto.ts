import { PartialType } from '@nestjs/swagger';
import { CreateFlagDto } from './create-flag.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AntiFraudFlagStatus } from '@prisma/client';

export class UpdateFlagDto extends PartialType(CreateFlagDto) {
  @IsEnum(AntiFraudFlagStatus)
  @IsOptional()
  status?: AntiFraudFlagStatus;

  @IsString()
  @IsOptional()
  reviewedBy?: string; // ID do admin que revisou
}
