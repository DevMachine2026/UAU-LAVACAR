import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsInt, IsNumber, IsNotEmpty, IsOptional, IsString, Min, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  ANPR_WEBHOOK_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  ALLOWED_ORIGINS!: string;

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

  @IsOptional()
  @IsString()
  MAILER_FROM?: string;

  @IsOptional()
  @IsString()
  MAILER_REJECT_UNAUTHORIZED?: string;

  @IsInt()
  @Min(1000) // rejeita se alguém colocar 60 (segundos) em vez de 60000 (ms)
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL: number;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_MAX: number;

  @IsString()
  @IsNotEmpty()
  ASAAS_WEBHOOK_TOKEN!: string;

  @IsOptional()
  @IsString()
  ASAAS_API_KEY?: string;

  @IsOptional()
  @IsString()
  ASAAS_BASE_URL?: string;

  @IsOptional()
  @IsString()
  ASAAS_ENVIRONMENT?: string;
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
