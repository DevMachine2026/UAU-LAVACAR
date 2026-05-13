# UAU+ Render + Vercel Staging Guide

Este guia sobe STAGING usando Render para backend/PostgreSQL e Vercel para o Web Dashboard. Nao use credenciais de producao.

URLs placeholder:

- API staging: `https://api-staging.seudominio.com`
- API base path: `https://api-staging.seudominio.com/api/v1`
- Dashboard staging: `https://dashboard-staging.seudominio.com`

## 1. Conectar GitHub no Render

1. Entre em `https://dashboard.render.com`.
2. Clique em `New +`.
3. Clique em `Blueprint`.
4. Conecte sua conta GitHub se ainda nao estiver conectada.
5. Selecione o repositorio `uau-clube-api`.
6. Render deve detectar o arquivo:

```text
render.yaml
```

7. Confirme a criacao do blueprint.

O blueprint cria:

- Web Service: `uau-core-backend-staging`
- PostgreSQL: `uau-core-postgres-staging`

## 2. Criar PostgreSQL staging no Render

Se usar o blueprint:

1. O banco `uau-core-postgres-staging` sera criado automaticamente.
2. Abra o banco no painel do Render.
3. Copie a `Internal Database URL` apenas se precisar configurar manualmente.
4. Nao cole senha nem connection string em arquivos do Git.

Se criar manualmente:

1. Clique em `New +`.
2. Clique em `PostgreSQL`.
3. Nome: `uau-core-postgres-staging`.
4. Database: `uau_core_staging`.
5. User: `uau_core_staging`.
6. Region: a mesma do backend.
7. Crie o banco.

## 3. Criar Web Service do backend

Se nao usar blueprint:

1. Clique em `New +`.
2. Clique em `Web Service`.
3. Selecione o repositorio `uau-clube-api`.
4. Configure:

```text
Name: uau-core-backend-staging
Root Directory: uau-core-backend
Runtime: Node
Build Command: npm install && npm run prisma:generate && npm run build
Start Command: npm run start:prod
```

5. Em `Environment`, configure as variaveis abaixo.

Se voce estiver usando um repositorio maior que tenha `uau-clube-api` dentro dele, use `uau-clube-api/uau-core-backend` como `Root Directory`. Neste workspace atual, o repositorio Git detectado e `uau-clube-api`, entao o root correto no Render e `uau-core-backend`.

## 4. Configurar envs no Render

No Web Service `uau-core-backend-staging`, abra `Environment` e configure:

```text
NODE_ENV=staging
PORT=10000
DATABASE_URL=<Internal Database URL do PostgreSQL Render>
JWT_SECRET=<secret forte de staging>
JWT_EXPIRES_IN=8h
ALLOWED_ORIGINS=https://dashboard-staging.seudominio.com
ASAAS_BASE_URL=https://sandbox.asaas.com
ASAAS_API_KEY=<chave sandbox Asaas>
ASAAS_WEBHOOK_TOKEN=<token webhook sandbox>
ASAAS_ENVIRONMENT=sandbox
ENABLE_SWAGGER=true
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=20
JSON_BODY_LIMIT=1mb
SUPER_ADMIN_EMAIL=admin-staging@uauplus.local
SUPER_ADMIN_PASSWORD=<senha staging>
SUPER_ADMIN_NAME=UAU+ Staging Admin
```

Nao use wildcard em `ALLOWED_ORIGINS`.

## 5. Rodar migrations no Render

Depois do primeiro deploy do backend:

1. Abra o Web Service `uau-core-backend-staging`.
2. Abra a aba `Shell`.
3. Execute:

```bash
npm run prisma:deploy
```

4. Se precisar popular staging:

```bash
npm run seed
```

O comando de migration e:

```bash
npm run prisma:deploy
```

Ele executa `npx prisma migrate deploy`.

## 6. Verificar health checks

Quando o backend estiver no ar, abra no navegador:

```text
https://api-staging.seudominio.com/api/v1/health
https://api-staging.seudominio.com/api/v1/health/ready
```

Esperado:

- `/health`: `status` igual a `ok`.
- `/health/ready`: `status` igual a `ready`.

Se ainda estiver usando URL `.onrender.com`, teste primeiro com ela. Depois configure o dominio customizado `api-staging.seudominio.com`.

## 7. Configurar dominio da API no Render

1. Abra o Web Service no Render.
2. Va em `Settings`.
3. Procure `Custom Domains`.
4. Adicione:

```text
api-staging.seudominio.com
```

5. Configure o DNS conforme o Render mostrar.
6. Aguarde SSL ficar ativo.

## 8. Conectar GitHub na Vercel

1. Entre em `https://vercel.com`.
2. Clique em `Add New...`.
3. Clique em `Project`.
4. Importe o repositorio.
5. Em `Root Directory`, selecione:

```text
uau-web-dashboard
```

6. Framework deve aparecer como `Next.js`.

## 9. Configurar env da Vercel

No projeto Vercel do dashboard, va em `Settings > Environment Variables`.

Adicione para Preview/Staging:

```text
NEXT_PUBLIC_API_URL=https://api-staging.seudominio.com/api/v1
```

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```

## 10. Configurar dominio do dashboard na Vercel

1. Abra `Settings > Domains`.
2. Adicione:

```text
dashboard-staging.seudominio.com
```

3. Configure DNS conforme a Vercel mostrar.
4. Aguarde SSL ficar ativo.

Depois, confirme no Render que:

```text
ALLOWED_ORIGINS=https://dashboard-staging.seudominio.com
```

## 11. Testar login no dashboard

1. Acesse:

```text
https://dashboard-staging.seudominio.com/login
```

2. Entre com o Super Admin staging.
3. Abra:

```text
/admin
/admin/settings
/admin/financial
/operator/plate-check
```

4. Se der erro de CORS, revise `ALLOWED_ORIGINS` no Render.

## 12. Configurar webhook Asaas sandbox

No painel Asaas sandbox:

1. Abra configuracao de webhooks.
2. Crie webhook apontando para a URL staging do backend.
3. Use o token definido em `ASAAS_WEBHOOK_TOKEN`.
4. Selecione eventos de cobranca/pagamento usados pelo UAU+.
5. Gere um evento sandbox controlado.
6. Confira logs do Render.

## 13. Smoke test staging

No seu computador:

PowerShell:

```powershell
cd uau-clube-api/uau-core-backend
$env:E2E_BASE_URL="https://api-staging.seudominio.com/api/v1"
$env:SUPER_ADMIN_EMAIL="admin-staging@uauplus.local"
$env:SUPER_ADMIN_PASSWORD="<senha staging>"
npm run smoke:staging
```

## Pendencias manuais

- Criar/confirmar conta Render.
- Criar/confirmar conta Vercel.
- Conectar GitHub nas duas plataformas.
- Preencher `JWT_SECRET`.
- Preencher `ASAAS_API_KEY` sandbox.
- Preencher `ASAAS_WEBHOOK_TOKEN`.
- Preencher `SUPER_ADMIN_PASSWORD`.
- Configurar DNS de `api-staging.seudominio.com`.
- Configurar DNS de `dashboard-staging.seudominio.com`.
- Rodar migrations no Shell do Render.
- Configurar webhook Asaas sandbox.
