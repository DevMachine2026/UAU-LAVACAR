import { plainToInstance, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsOptional()
  @IsString()
  MAILER_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  MAILER_PORT?: number;

  @IsOptional()
  @IsString()
  MAILER_USER?: string;

  @IsOptional()
  @IsString()
  MAILER_PASS?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
