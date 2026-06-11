import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum PartnerStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class ListPartnersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou e-mail' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PartnerStatusFilter, description: '"active" ou "inactive"' })
  @IsOptional()
  @IsEnum(PartnerStatusFilter)
  status?: PartnerStatusFilter;
}
