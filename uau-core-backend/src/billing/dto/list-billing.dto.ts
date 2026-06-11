import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ListBillingDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID do cliente' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Data inicial — vencimento (ISO 8601, ex: 2025-01-01)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final — vencimento (ISO 8601, ex: 2025-12-31)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
