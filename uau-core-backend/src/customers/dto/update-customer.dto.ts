import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto } from './create-customer.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { UserStatus } from '@prisma/client';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
