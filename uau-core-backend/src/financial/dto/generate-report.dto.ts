// uau-core-backend/src/financial/dto/generate-report.dto.ts
import { IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  unitId: string;

  @IsString()
  periodStart: string;

  @IsString()
  periodEnd: string;
}
