# UAU+ Deployment Guide

Este guia prepara o deploy. Ele nao executa deploy automaticamente.

## Documentos relacionados

- `PROJECT_STRUCTURE.md`: estrutura oficial do projeto.
- `STAGING_DEPLOYMENT_GUIDE.md`: preparacao e deploy em staging.
- `PRODUCTION_GO_LIVE_GUIDE.md`: fases de producao e go-live controlado.
- `ROLLBACK_PLAN.md`: plano de rollback.
- `POST_DEPLOY_SMOKE_TEST.md`: roteiro de smoke test pos-deploy.
- `PRODUCTION_CHECKLIST.md`: checklist final de producao.
- `FINAL_AUDIT_REPORT.md`: resultado da auditoria final.

## 1. Backend

Diretorio oficial do backend: `uau-core-backend` (na raiz do monorepo).

Nao use a pasta obsoleta `uau-clube-api` para deploy, build, migrations ou seed.

Antes de executar qualquer comando de backend:

```bash
cd uau-core-backend
```

1. Instalar dependencias:

```bash
npm ci
```

2. Configurar variaveis de ambiente de producao:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=https://dashboard.seudominio.com,https://app.seudominio.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=20
JSON_BODY_LIMIT=1mb
ENABLE_SWAGGER=false
ASAAS_BASE_URL=https://api.asaas.com
ASAAS_API_KEY=<asaas-production-key>
ASAAS_WEBHOOK_TOKEN=<webhook-token>
ASAAS_ENVIRONMENT=production
SUPER_ADMIN_EMAIL=<admin-email>
SUPER_ADMIN_PASSWORD=<initial-password>
SUPER_ADMIN_NAME=<admin-name>
```

3. Gerar Prisma Client:

```bash
npm run prisma:generate
```

4. Aplicar migrations em producao:

```bash
npx prisma migrate deploy
```

5. Rodar seed inicial quando necessario:

```bash
npm run seed
```

6. Gerar OpenAPI:

```bash
npm run openapi:export
```

7. Build:

```bash
npm run build
```

8. Start:

```bash
npm run start
```

## 2. Banco PostgreSQL

- Usar PostgreSQL gerenciado.
- Habilitar backups automaticos.
- Criar usuario com privilegios minimos necessarios.
- Restringir acesso por rede quando a plataforma permitir.
- Testar restore antes de producao.

## 3. Docker

O backend oficial em `uau-core-backend` possui `Dockerfile` e `docker-compose.yml`.

Build local:

```bash
cd uau-core-backend
docker build -t uau-core-backend .
```

Banco local:

```bash
cd uau-core-backend
docker compose up -d postgres
```

Observacao: o `docker-compose.yml` atual sobe apenas PostgreSQL local. O servico de API deve ser adicionado se a estrategia de deploy for Compose completo.

## 4. Web Dashboard

Diretorio: `uau-web-dashboard`.

1. Configurar env:

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

2. Validar:

```bash
npm ci
npm run typecheck
npm run build
```

3. Start:

```bash
npm run start
```

4. Configurar dominio:

- `https://dashboard.seudominio.com`
- SSL ativo
- CORS liberado no backend em `ALLOWED_ORIGINS`

## 5. Mobile

Diretorio: `uau-mobile-app`.

1. Configurar env:

```env
EXPO_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

2. Validar:

```bash
npm ci
npm run typecheck
npx expo-doctor
```

3. Build EAS:

```bash
npx eas build --platform android
npx eas build --platform ios
```

4. Testar em canal interno antes de publicar.

## 6. Asaas

1. Criar app/credenciais no Asaas.
2. Configurar `ASAAS_API_KEY` em segredo do ambiente.
3. Configurar webhook para a URL publica do backend.
4. Configurar `ASAAS_WEBHOOK_TOKEN`.
5. Testar eventos de pagamento, falha, chargeback/estorno quando aplicavel.
6. Validar idempotencia de webhook.

## 7. Smoke tests pos-deploy

1. Acessar health check/API base.
2. Testar login Super Admin no web dashboard.
3. Testar login mobile.
4. Criar/consultar plano e unidade.
5. Simular fluxo de assinatura em sandbox/homologacao.
6. Validar baixa manual de placa.
7. Validar ANPR simulado.
8. Validar fechamento de expediente.
9. Validar financeiro/ledger/float.
10. Validar webhook Asaas com evento controlado.

## 8. Ordem recomendada

1. Provisionar banco.
2. Deploy backend com env de producao.
3. Rodar migrations.
4. Rodar seed inicial.
5. Smoke test backend.
6. Deploy web dashboard.
7. Smoke test web por perfil.
8. Build mobile homologacao.
9. Smoke test mobile.
10. Ativar Asaas producao e webhooks.
