import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = path.resolve(__dirname, '../..');
const envPath = path.join(projectRoot, '.env');
const envTestPath = path.join(projectRoot, '.env.test');

// Carrega .env para valores não sensíveis de teste, depois .env.test com prioridade.
dotenv.config({ path: envPath });

const hasEnvTest = fs.existsSync(envTestPath);
if (hasEnvTest) {
  dotenv.config({ path: envTestPath, override: true });
}

// Garante que env vars mínimas estão definidas para o ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-key-integration';
process.env.ANPR_WEBHOOK_SECRET ??= 'test-anpr-secret';
process.env.ALLOWED_ORIGINS ??= 'http://localhost:3001';
process.env.ASAAS_API_KEY ??= 'test-asaas-key';
process.env.ASAAS_WEBHOOK_TOKEN ??= 'test-webhook-token';
process.env.RATE_LIMIT_TTL ??= '60000';
process.env.RATE_LIMIT_MAX ??= '100';

// TEST_DATABASE_URL sempre vence para impedir que a suite use o banco real por acidente.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.DIRECT_URL = process.env.TEST_DATABASE_URL;
}

if (!hasEnvTest && !process.env.TEST_DATABASE_URL) {
  throw new Error(
    'Test database not configured. Create uau-core-backend/.env.test or set TEST_DATABASE_URL before running backend tests.',
  );
}

// DIRECT_URL necessário pelo schema Prisma.
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
