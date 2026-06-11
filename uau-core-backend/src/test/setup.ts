import * as dotenv from 'dotenv';
import * as path from 'path';

// Carrega variáveis do .env na raiz do projeto (uau-core-backend/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Garante que env vars mínimas estão definidas para o ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-key-integration';
process.env.ANPR_WEBHOOK_SECRET ??= 'test-anpr-secret';
process.env.ALLOWED_ORIGINS ??= 'http://localhost:3001';
process.env.ASAAS_API_KEY ??= 'test-asaas-key';
process.env.ASAAS_WEBHOOK_TOKEN ??= 'test-webhook-token';
process.env.RATE_LIMIT_TTL ??= '60000';
process.env.RATE_LIMIT_MAX ??= '100';

// DIRECT_URL necessário pelo schema Prisma (Neon connection pooling)
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
