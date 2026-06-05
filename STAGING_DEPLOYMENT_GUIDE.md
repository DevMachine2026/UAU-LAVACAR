# UAU+ Staging Deployment Guide

Este guia prepara o deploy em STAGING. Nao execute deploy real sem credenciais, dominio e banco provisionados.

## Estrutura oficial

- Backend oficial: `uau-core-backend` (na raiz do monorepo)
- Web Dashboard: `uau-web-dashboard`
- Mobile: `uau-mobile-app`

Nao use a pasta obsoleta `uau-clube-api` para backend.

URLs finais placeholder para staging:

- API: `https://api-staging.seudominio.com`
- API com prefixo: `https://api-staging.seudominio.com/api/v1`
- Dashboard: `https://dashboard-staging.seudominio.com`

Guia passo a passo para Render + Vercel:

```text
RENDER_VERCEL_STAGING_GUIDE.md
```

## 1. Criar banco staging

Provisionar um PostgreSQL separado de producao.

Requisitos:

- banco dedicado para staging;
- usuario/senha exclusivos;
- backups opcionais, mas recomendados;
- acesso restrito ao backend staging.

Exemplo local com Docker Compose:

```bash
cd uau-core-backend
docker compose -f docker-compose.staging.yml up -d postgres
```

## 2. Configurar env do backend

Copiar o exemplo:

```bash
cd uau-core-backend
cp .env.staging.example .env.staging
```

Preencher sem commitar:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
JWT_SECRET=<staging-secret>
ALLOWED_ORIGINS=https://dashboard-staging.seudominio.com
ASAAS_BASE_URL=https://sandbox.asaas.com
ASAAS_API_KEY=<sandbox-key>
ASAAS_WEBHOOK_TOKEN=<sandbox-webhook-token>
ASAAS_ENVIRONMENT=sandbox
ENABLE_SWAGGER=true
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=20
JSON_BODY_LIMIT=1mb
```

Staging deve usar Asaas sandbox e Swagger habilitado.

## 3. Rodar migrations

```bash
cd uau-core-backend
npm ci
npm run prisma:generate
npm run prisma:deploy
```

`prisma:deploy` usa `npx prisma migrate deploy`.

## 4. Seed staging

```bash
cd uau-core-backend
npm run seed
```

Validar o Super Admin de staging definido nas envs.

## 5. Subir backend

Build e start sem Docker:

```bash
cd uau-core-backend
npm run build:prod
npm run start:prod
```

Com Docker Compose staging:

```bash
cd uau-core-backend
docker compose -f docker-compose.staging.yml up -d --build
```

## 6. Configurar webhook Asaas sandbox

Configurar no painel Asaas sandbox:

- URL publica do backend staging;
- token igual a `ASAAS_WEBHOOK_TOKEN`;
- eventos de cobranca/pagamento usados pelo fluxo UAU+.

Confirmar que o endpoint esta permitido pelo rate limit e que os logs registram o recebimento.

## 7. Subir web dashboard staging

Copiar env:

```bash
cd uau-web-dashboard
cp .env.staging.example .env.local
```

Conferir:

```env
NEXT_PUBLIC_API_URL=https://api-staging.seudominio.com/api/v1
```

Build:

```bash
npm ci
npm run typecheck
npm run build:staging
```

Deployar para o dominio:

```text
https://dashboard-staging.seudominio.com
```

Adicionar esse dominio em `ALLOWED_ORIGINS` do backend staging.

## 8. Rodar smoke test staging

Definir a URL:

PowerShell:

```powershell
$env:E2E_BASE_URL="https://api-staging.seudominio.com/api/v1"
$env:SUPER_ADMIN_EMAIL="admin-staging@uauplus.local"
$env:SUPER_ADMIN_PASSWORD="<senha-staging>"
npm run smoke:staging
```

Bash:

```bash
E2E_BASE_URL=https://api-staging.seudominio.com/api/v1 \
SUPER_ADMIN_EMAIL=admin-staging@uauplus.local \
SUPER_ADMIN_PASSWORD='<senha-staging>' \
npm run smoke:staging
```

Smoke test documentado:

- `GET /health`
- `GET /health/ready`
- login Super Admin;
- `GET /admin-settings`;
- `GET /admin-dashboard/overview`.

Testes manuais adicionais recomendados:

- `GET /financial/overview` com token Super Admin;
- `GET /billing/my-current` com cliente teste, quando o seed/ambiente possuir cliente;
- fluxo de assinatura em Asaas sandbox;
- baixa manual por placa;
- ANPR simulado;
- fechamento de expediente.

## 9. Testar mobile apontando para staging

Copiar env:

```bash
cd uau-mobile-app
cp .env.staging.example .env
```

Conferir:

```env
EXPO_PUBLIC_API_URL=https://api-staging.seudominio.com/api/v1
```

Validar sem gerar build de loja:

```bash
npm ci
npm run typecheck
npx expo-doctor
npx expo start
```

## Segurança de staging

- Nunca commitar `.env.staging`.
- Commitar apenas `.env.staging.example`.
- Usar Asaas sandbox.
- Usar `ENABLE_SWAGGER=true` apenas em staging/homologacao.
- Configurar `ALLOWED_ORIGINS` para o dashboard staging.
- Usar `JWT_SECRET` diferente de desenvolvimento e producao.
- Usar banco isolado de producao.

## Pendencias para deploy real

- Credenciais do provedor cloud.
- URL final da API staging.
- URL final do dashboard staging.
- Banco PostgreSQL staging.
- Chave Asaas sandbox.
- Token de webhook Asaas sandbox.
- Senha Super Admin staging.
- Decisao sobre expor/proteger Swagger em staging.
