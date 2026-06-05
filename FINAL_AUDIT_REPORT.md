# UAU+ Final Audit Report

Data: 2026-05-09

## Escopo auditado

- Backend real: `uau-core-backend` (na raiz do monorepo)
- Pasta obsoleta: `uau-clube-api` (vazia)
- Mobile: `uau-mobile-app`
- Web Dashboard: `uau-web-dashboard`

Observacao estrutural (auditoria 2026-05-09): na epoca, o backend estava documentado em `uau-clube-api/uau-core-backend`. **Atualizacao 2026-06-04:** o backend oficial e ativo e `uau-core-backend` na raiz do monorepo; `uau-clube-api` esta obsoleta/vazia. Ver `PROJECT_STRUCTURE.md` e `uau-clube-api/README_DO_NOT_USE.md`.

## Validacoes executadas

### Backend

Diretorio: `uau-core-backend`

- `npm run build`: passou.
- `npx tsc --noEmit`: passou.
- `npm run openapi:export`: passou e gerou `openapi.json`.
- `npx prisma validate`: falhou inicialmente porque `DATABASE_URL` nao estava carregado no ambiente.
- `npx prisma validate` com `DATABASE_URL` local temporaria: passou.
- `npm run test:smoke`: nao passou porque a API nao estava rodando em `http://localhost:3000/api/v1`.

### Mobile

Diretorio: `uau-mobile-app`

- `npm run typecheck`: passou.
- `npx expo-doctor`: passou com permissao elevada para permitir download/cache do `npx`.

### Web Dashboard

Diretorio: `uau-web-dashboard`

- `npm run typecheck`: passou.
- `npm run build`: passou com permissao elevada. A primeira execucao falhou com `spawn EPERM` no sandbox, comportamento ja observado nos builds Next.js deste ambiente.

## Auditoria de configuracao

### Backend

- `.env.example`: existe no backend real.
- Prisma migrations: existem.
- Seed: existe em `prisma/seed.ts`.
- Dockerfile: existe.
- Docker Compose: existe para PostgreSQL local.
- CORS: configurado via `ALLOWED_ORIGINS`.
- Helmet: configurado.
- Rate limit: configurado para login e webhook ANPR.
- Swagger/OpenAPI: configurado e exportavel.
- Asaas envs: existem no `.env.example`.
- Health checks: o Compose tem healthcheck do PostgreSQL; nao foi confirmado endpoint HTTP dedicado de health da API.

### Mobile

- `.env.example`: existe com `EXPO_PUBLIC_API_URL`.
- Typecheck: passou.
- Expo Doctor: passou.
- App esta focado no assinante/cliente.

### Web Dashboard

- `.env.example`: existe com `NEXT_PUBLIC_API_URL`.
- Typecheck/build: passaram.
- Rotas protegidas por role estao presentes no layout e `ProtectedRoute`.

## Gitignore

Atualizado:

- `uau-core-backend/.gitignore`
- `uau-mobile-app/.gitignore`
- `uau-web-dashboard/.gitignore`

Itens cobertos:

- `.env`
- `.env.*` com excecao de `.env.example`
- `node_modules`
- `dist`
- `.next`
- `.expo`
- artefatos mobile Android/iOS/EAS
- logs
- coverage

## Secrets

Foi feita busca por nomes sensiveis como `ASAAS_API_KEY`, `JWT_SECRET`, `DATABASE_URL`, `TOKEN`, `PASSWORD` e similares, excluindo `node_modules`, `dist`, `.next` e locks.

Resultado:

- Nao foi encontrado segredo real em arquivos de codigo versionaveis durante a varredura.
- A pasta raiz `uau-core-backend` contem `.env` local com valores de desenvolvimento. Foi adicionado `.gitignore` para impedir commit acidental.
- `.env.example` do backend real contem placeholders e valores locais de desenvolvimento; antes de producao, trocar todos os segredos em plataforma segura.

## Vulnerabilidades npm observadas

`npm audit --audit-level=moderate` foi executado com permissao elevada nos tres projetos.

### Backend

Resultado: 22 vulnerabilidades.

- 4 low
- 12 moderate
- 6 high

Principais pacotes/advisories envolvidos:

- `@nestjs/core` / `@nestjs/platform-express`
- `multer`
- `lodash`
- `glob`
- `picomatch`
- `webpack`
- `file-type`
- `js-yaml`
- `ajv`
- `tmp`

Observacao: varias correcoes sugerem `npm audit fix --force` com upgrade breaking para Nest 11/CLI 11. Recomenda-se planejar janela de upgrade e teste regressivo.

### Mobile

Resultado: 8 vulnerabilidades.

- 2 moderate
- 6 high

Principais pacotes/advisories:

- `@xmldom/xmldom`
- `postcss`
- `tar`
- Cadeia Expo/Metro/CLI

Observacao: `npm audit fix --force` sugeriu downgrade/alteracao breaking de Expo. Recomenda-se atualizar Expo/SDK de forma planejada.

### Web Dashboard

Resultado: 2 vulnerabilidades moderadas.

- `postcss` via `next`

Observacao: `npm audit fix --force` sugeriu alteracao breaking inadequada. Recomenda-se atualizar Next/PostCSS dentro de uma janela controlada.

## Pendencias antes de producao

- Manter a orientacao oficial: backend de deploy somente em `uau-core-backend`; nunca usar `uau-clube-api`.
- Endpoint HTTP `GET /api/v1/health` implementado para health check (Render e load balancers).
- Em producao, usar `npx prisma migrate deploy`, nao `prisma migrate dev`.
- Rodar smoke test com API e banco ativos.
- Resolver ou aceitar formalmente as vulnerabilidades npm antes do go-live.
- Configurar `ALLOWED_ORIGINS` apenas com dominios reais.
- Garantir `ENABLE_SWAGGER=false` em producao publica, ou proteger Swagger.
- Configurar Asaas producao e validar webhook ponta a ponta.
- Configurar backups e teste de restore do PostgreSQL.
- Validar todos os perfis no web dashboard em ambiente de homologacao.
- Rodar build mobile EAS Android/iOS em canal interno.

## Ordem recomendada de deploy

1. Estrutura oficial do backend consolidada em `uau-core-backend` (concluido em 2026-06-04).
2. Provisionar PostgreSQL com backup.
3. Configurar secrets em ambiente seguro.
4. Deploy backend em homologacao.
5. Rodar `npx prisma migrate deploy`.
6. Rodar seed inicial.
7. Rodar smoke tests.
8. Deploy web dashboard em homologacao.
9. Validar login e rotas por perfil.
10. Build mobile homologacao.
11. Validar assinatura, cashback, veiculos, historico e perfil.
12. Configurar Asaas producao/webhook.
13. Executar smoke tests pos-deploy.
14. Liberar producao.
