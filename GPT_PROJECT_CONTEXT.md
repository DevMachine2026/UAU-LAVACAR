# GPT_PROJECT_CONTEXT.md - Contexto Mestre UAU+ Lavacar

> Use este arquivo como briefing principal para alimentar um GPT/Codex/assistente de engenharia. Ele consolida os Markdown do repositorio, incluindo arquitetura, regras de negocio, deploy, staging, rollback, auditoria, publicacao mobile, specs historicas e pontos de atencao.

## 1. Como o GPT deve trabalhar neste projeto

Ao responder ou implementar qualquer tarefa neste projeto:

- Trabalhe em portugues brasileiro, de forma objetiva.
- Antes de sugerir endpoints, confira controllers e clientes existentes.
- Preserve a arquitetura atual: backend NestJS, dashboard Next.js e mobile Expo.
- Nao invente um novo padrao quando ja existe service, DTO, API client, store ou componente compartilhado.
- Ao mexer em auth, roles, assinatura, cobranca, wallet, Asaas, placa ou operacao, explique impactos em backend, dashboard e mobile.
- Ao mexer em deploy, confira scripts reais em `package.json`; alguns docs antigos citam scripts que nao existem mais.
- Nunca exponha segredos reais. Use placeholders.
- Nao reverta mudancas nao relacionadas.
- Sugira testes especificos, principalmente para fluxos financeiros, checkout, webhook, auth e operacao.

Prompt recomendado:

```text
Voce e um engenheiro senior trabalhando no UAU+ Lavacar. Leia todo o contexto abaixo antes de responder. Respeite a arquitetura existente, os fluxos de negocio, roles, envelope da API, Asaas, wallet/cashback, operacao por placa e separacao entre mobile do cliente e web dashboard administrativo.

Tarefa: [descreva aqui]

Ao responder:
- indique arquivos provaveis a alterar;
- explique impactos em backend, dashboard e mobile quando houver;
- preserve compatibilidade com os fluxos descritos;
- sugira testes especificos;
- nao invente endpoints sem conferir controllers/clientes existentes.
```

## 2. Fontes consolidadas

Este documento foi consolidado a partir de:

- `DOC.MD`
- `ARCHITECTURE_SUMMARY.md`
- `PROJECT_STRUCTURE.md`
- `DEPLOYMENT_GUIDE.md`
- `STAGING_DEPLOYMENT_GUIDE.md`
- `RENDER_VERCEL_STAGING_GUIDE.md`
- `PRODUCTION_GO_LIVE_GUIDE.md`
- `PRODUCTION_CHECKLIST.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `ROLLBACK_PLAN.md`
- `FINAL_AUDIT_REPORT.md`
- `uau-web-dashboard/README.md`
- `uau-mobile-app/README.md`
- `uau-mobile-app/PUBLICACAO_STORES.md`
- `uau-core-backend/docs/vehicleid-backfill-revisao-manual.md`
- `docs/superpowers/specs/*`
- `docs/superpowers/plans/*`

## 3. Resumo do produto

O UAU+ Lavacar e uma plataforma para clube de assinatura de lavagem automotiva com:

- app mobile para cliente/assinante;
- dashboard web para Super Admin, franqueado, parceiro e operador;
- backend API central;
- planos de assinatura com cobertura por unidade/cidade/estado/nacional;
- precificacao por porte de veiculo;
- cobrancas via Asaas;
- wallet/cashback, bonus de boas-vindas e bonus de indicacao;
- rede/MMN;
- operacao de lavacar por expediente, placa, baixa manual e ANPR;
- parceiros com transacoes e cashback;
- financeiro, ledger, float, repasses e relatorios;
- antifraude, logs de seguranca e flags;
- notificacoes e campanhas.

O mobile deve continuar focado no cliente. Portais administrativos, operacionais, franqueados e parceiros pertencem ao dashboard web.

## 4. Estrutura oficial

```text
.
|-- uau-core-backend/      # Backend oficial NestJS + Prisma
|-- uau-web-dashboard/     # Dashboard web Next.js
|-- uau-mobile-app/        # App mobile Expo/React Native
|-- docs/superpowers/      # Specs e planos historicos
|-- *.md                   # Guias de arquitetura, deploy, auditoria e operacao
`-- GPT_PROJECT_CONTEXT.md # Este briefing mestre
```

Diretorios oficiais:

- Backend: `uau-core-backend`
- Dashboard: `uau-web-dashboard`
- Mobile: `uau-mobile-app`

Pasta obsoleta:

- `uau-clube-api` e obsoleta/vazia em docs historicos. Nao usar para build, deploy, migrations ou seed.

Regra operacional: antes de comandos de backend, confirmar que o terminal esta em `uau-core-backend`.

## 5. Stack atual

Backend:

- NestJS 10
- TypeScript 5.7
- Prisma 5
- PostgreSQL
- JWT + Passport
- bcrypt
- class-validator/class-transformer
- Swagger/OpenAPI opcional
- Helmet
- Throttler/rate limit
- nestjs-pino
- Nodemailer/Resend SMTP
- Asaas
- Jest + ts-jest + Supertest

Dashboard:

- Next.js 15 App Router
- React 19
- TypeScript
- TailwindCSS 3
- Axios
- TanStack React Query
- Zustand
- React Hook Form
- Zod
- Lucide React
- Framer Motion
- jose
- Vitest

Mobile:

- Expo 54
- React Native 0.81
- React 19
- Expo Router
- TypeScript
- Axios
- TanStack React Query
- Zustand
- Expo SecureStore
- NativeWind
- React Hook Form
- Zod
- Sentry React Native

## 6. Scripts reais atuais

Backend (`uau-core-backend/package.json`):

```bash
npm run build              # prisma generate && nest build
npm run start              # node dist/src/main.js
npm run start:dev          # nest start --watch
npm run start:prod         # node dist/src/main.js
npm run prisma:generate
npm run prisma:migrate     # prisma migrate dev
npm run prisma:deploy      # prisma migrate deploy
npm run seed
npm run openapi:export
npm run migrate:from-old-db
npm run typecheck
npm test
npm run test:cov
npm run test:watch
```

Dashboard (`uau-web-dashboard/package.json`):

```bash
npm run dev
npm run build
npm run build:staging
npm run start
npm run typecheck
npm test
npm run test:watch
```

Mobile (`uau-mobile-app/package.json`):

```bash
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
```

Atencao:

- Docs antigos citam `npm run build:prod`, `npm run smoke:staging`, `npm run test:smoke` e `/health/ready`. Confira antes de usar: no estado atual visto, backend tem `build`, `start:prod`, `health`, mas nao tem `build:prod`, `smoke:staging`, `test:smoke` ou endpoint `health/ready`.
- Docs antigos tambem citam `RATE_LIMIT_TTL=60`; o validador atual exige valor em milissegundos e minimo `1000`. Use `60000` para 60 segundos.

## 7. Como rodar localmente

Backend:

```bash
cd uau-core-backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run start:dev
```

Dashboard:

```bash
cd uau-web-dashboard
npm install
npm run dev -- -p 3001
```

Mobile:

```bash
cd uau-mobile-app
npm install
npm run start
```

Se backend e dashboard competirem pela porta `3000`, rode dashboard em `3001`.

## 8. Variaveis de ambiente

Backend principais:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `DIRECT_URL` quando Prisma precisar de direct connection
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ALLOWED_ORIGINS`
- `ENABLE_SWAGGER`
- `RATE_LIMIT_TTL`
- `RATE_LIMIT_MAX`
- `ANPR_WEBHOOK_SECRET`
- `ASAAS_ENVIRONMENT`
- `ASAAS_BASE_URL`
- `ASAAS_API_KEY`
- `ASAAS_WEBHOOK_TOKEN`
- `MAILER_HOST`
- `MAILER_PORT`
- `MAILER_USER`
- `MAILER_PASS`
- `MAILER_FROM`
- `MAILER_REJECT_UNAUTHORIZED`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_NAME`

Dashboard:

- `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
- variavel/segredo de sessao usado por `src/lib/session.ts`, se exigido pelo ambiente.

Mobile:

- `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
- Android Emulator: `http://10.0.2.2:3000/api/v1`
- celular fisico Expo Go: usar IP LAN da maquina.

Producao:

- Asaas: `ASAAS_BASE_URL=https://api.asaas.com`, `ASAAS_ENVIRONMENT=production`
- CORS: `ALLOWED_ORIGINS` sem wildcard, com dominios reais do dashboard/app.
- Swagger: `ENABLE_SWAGGER=false` em producao publica, ou proteger por rede/auth.

## 9. Backend: arquitetura e padroes

Entradas:

- `uau-core-backend/src/main.ts`
- `uau-core-backend/src/app.module.ts`

Padroes globais:

- Prefixo global: `/api/v1`
- CORS configurado por `ALLOWED_ORIGINS`
- Helmet ativo
- `ValidationPipe` global com `whitelist`, `transform`, `forbidNonWhitelisted`
- `ResponseEnvelopeInterceptor` envelopa retornos em `{ success: true, data }`
- `GlobalExceptionFilter` padroniza erros
- Swagger em `/api/docs` se habilitado
- Guards globais: throttling, JWT e roles
- Rotas publicas usam `@Public()`
- Controllers nao devem incluir `/api/v1`; o prefixo e global.
- Service deve concentrar regra de negocio.
- DTOs devem usar `class-validator`.
- Em integracoes externas, evitar chamadas HTTP dentro de transacoes Prisma longas.
- Webhooks devem ser idempotentes.

Modulos principais carregados:

- Auth
- Users
- AdminSettings
- States
- Cities
- FranchiseUnits
- VehicleSizes
- Plans
- Partners
- Campaigns
- Customers
- Vehicles
- Subscriptions
- Checkout
- Billing
- Wallet
- Asaas
- Operations
- ANPR
- Financial
- Antifraud
- Referrals
- Notifications
- AdminDashboard
- FranchiseDashboard
- PartnerDashboard
- WelcomeBonus
- Mailer

Health atual:

- `GET /api/v1/health` publico retorna status `ok` e timestamp.
- Docs antigos citam `/health/ready`; conferir/implementar se plataforma exigir readiness.

## 10. Banco de dados e modelos

Schema:

- `uau-core-backend/prisma/schema.prisma`

Modelos centrais:

- `User`: usuario base, role, status, betaAccess e defaultUnit.
- `Customer`: perfil cliente, CPF, telefone, Asaas customer, referral code.
- `Vehicle`: veiculos, placa unica, marca/modelo/cor, porte, primario.
- `Plan`: planos, preco, cobertura, dias/horarios, periodicidade, maxVehicles e precificacao por porte.
- `PlanAvailability`: disponibilidade por estado/cidade/unidade.
- `VehicleSizeCategory`: categorias de porte.
- `VehicleModelSizeRule`: regra marca/modelo para porte.
- `PlanVehicleSizePrice`: preco de plano por porte.
- `Subscription`: assinatura por cliente/plano/veiculo.
- `BillingHistory`: cobrancas, status, invoice, PIX, boleto, Asaas.
- `Wallet`: balance, promoBalance, blockedBalance, welcomeBonusBalance.
- `WalletMovement`: extrato.
- `FranchiseUnit`: unidade/franquia.
- `UnitStaff`: vinculo de usuarios a unidades.
- `Shift`, `ShiftClosure`, `Attendance`, `DailyWash`: operacao.
- `AnprCamera`, `AnprEvent`: placas/ANPR.
- `Partner`, `PartnerTransaction`: parceiros.
- `Campaign`: campanhas, opcionalmente ligadas a parceiro.
- `FinancialLedger`, `FranchiseRule`, `FranchiseReport`: financeiro.
- `AntiFraudFlag`, `SecurityLog`: antifraude.
- `Referral`: indicacoes/rede.
- `WelcomeBonusGrant`: bonus de boas-vindas.
- `Notification`: notificacoes.
- `WashService`, `IndividualServicePurchase`, `IndividualServicePurchaseItem`: servicos avulsos.
- `RevokedToken`: revogacao de tokens.

Enums relevantes:

- UserRole: `SUPER_ADMIN`, `FRANCHISE_OWNER`, `PARTNER`, `OPERATOR`, `CUSTOMER`
- UserStatus: `ACTIVE`, `BLOCKED`, `SUSPECT`, `INACTIVE`
- SubscriptionStatus: `PENDING`, `ACTIVE`, `OVERDUE`, `CANCELLED`, `SUSPENDED`
- BillingStatus: `PENDING`, `PAID`, `OVERDUE`, `CANCELLED`, `REFUNDED`
- PlanPeriodicity: `MONTHLY`, `QUARTERLY`, `SEMIANNUALLY`, `YEARLY`
- WalletMovementOrigin inclui `SUBSCRIPTION`, `PARTNER_TRANSACTION`, `WELCOME_BONUS`, `REFERRAL_BONUS`, `BILLING_DEDUCTION`
- AttendanceStatus: `PENDING`, `COMPLETED`, `CANCELLED`
- AttendanceType: `MANUAL`, `ANPR`
- AnprEventStatus: `AUTHORIZED`, `BLOCKED`, `AVULSO`, `UNKNOWN`, `SUSPECT`

## 11. Auth e autorizacao

Login backend:

- `POST /api/v1/auth/login`
- Confere email/senha.
- Rejeita usuario inativo/bloqueado.
- Rejeita usuario sem `betaAccess`, exceto `SUPER_ADMIN`.
- Gera JWT com `sub`, `email`, `role`, `jti`.
- Retorna `{ accessToken, user }` dentro do envelope.

Rotas auth:

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`

Dashboard web:

- A decisao aprovada e token em memoria Zustand + cookie HTTP-only para persistencia.
- `POST /api/auth` no Next chama backend `/auth/login`, seta cookie e retorna token/user ao store.
- `GET /api/auth/session` le cookie server-side e reidrata memoria.
- `DELETE /api/auth` remove cookie.
- Axios continua enviando `Authorization: Bearer` a partir do token em memoria.
- Middleware protege `/admin`, `/franchise`, `/partner`, `/operator` por role.

Trade-off registrado:

- Token nao fica em `localStorage`, reduzindo exposicao XSS persistente.
- Durante sessao ativa, token ainda pode ser devolvido por `/api/auth/session`; CSP e higiene de XSS continuam importantes.

## 12. Regras de negocio essenciais

Assinatura e planos:

- Plano pode ter preco unico ou preco por porte.
- `useVehicleSizePricing=false`: usa `Plan.price`.
- `useVehicleSizePricing=true`: resolve porte do veiculo por regra/modelo e busca `PlanVehicleSizePrice`.
- Assinatura ativa ou em atraso por veiculo bloqueia nova assinatura do mesmo veiculo.
- Plano mensal cria subscription recorrente no Asaas.
- Plano trimestral/semestral/anual cria cobranca unica no Asaas.

Checkout:

- Preview calcula preco, cashback utilizavel e gatewayAmount.
- Confirmacao chama Asaas fora da transacao DB.
- Transacao DB cria subscription, billing e debita cashback atomicamente.
- Se Asaas cobrou e DB falhou, logs devem conter IDs para reconciliacao manual.
- Se cashback cobre valor integral, usar PIX e enviar cobranca minima de `0.01`.
- Testes devem esperar `PENDING` logo apos checkout; `ACTIVE/PAID` so depois de webhook confirmado.

Asaas:

- Criar/buscar customer por CPF/CNPJ.
- Criar subscription ou payment conforme periodicidade.
- Buscar QR Code PIX quando aplicavel.
- Webhook processa pagamentos recebidos/confirmados, atrasados, cancelados e subscriptions deletadas/inativadas.
- Webhook deve ser idempotente.
- Pagamento confirmado marca billing `PAID`, subscription `ACTIVE`, define `startedAt/expiresAt` e pode conceder bonus de indicacao.

Wallet/cashback:

- Wallet separa saldo real, promocional, bloqueado e bonus de boas-vindas.
- Cashback usado em assinatura debita wallet e registra movimento.
- Bonus de indicacao credita `promoBalance` do indicador na primeira assinatura ativa do indicado.

Bonus de boas-vindas:

- Settings seedados: `WELCOME_BONUS_AMOUNT=21.00`, `WELCOME_BONUS_DAILY_DECAY=3.00`.
- Cron diario em `America/Fortaleza`.
- Decaimento calcula dias locais e reduz saldo esperado.
- Se usuario ja gastou acima do decaimento, nao reduz indevidamente.
- Zera e marca `fullyExpiredAt` ao expirar.

Operacao/lavagens:

- Operador abre turno por unidade.
- Apenas um turno aberto por unidade.
- Operador precisa pertencer a unidade via `UnitStaff`.
- Checagem de placa verifica veiculo, customer, assinatura, atraso, uso diario.
- Confirmar lavagem exige assinatura ativa e nao expirada.
- `DailyWash` com unique `vehicleId + date` impede mais de uma lavagem/dia.
- Fechamento cria `ShiftClosure`.

ANPR:

- Webhook registra eventos de placa.
- Eventos classificam status para operacao.
- Dashboard tem telas de ANPR, placa manual e expedientes.

Parceiros:

- Parceiro possui percentuais de cashback/comissao e limite de cashback aceito.
- Cliente pode simular e confirmar transacao no mobile.
- Cashback usado no parceiro opera como desconto do parceiro.
- Novo cashback incide sobre valor pago via PIX/cartao.

MMN/referrals:

- `Referral` liga indicador e indicado.
- Mobile mostra resumo e arvore.
- Bonus na primeira assinatura ativa do indicado.
- Historicamente houve bug raw SQL usando `"User"` em vez de tabela `users`; conferir estado atual antes de alterar referrals.

## 13. Endpoints principais

Todos assumem prefixo `/api/v1`.

Auth/users:

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- `GET /users/me`
- `PATCH /users/:id/beta-access`

Localizacao/unidades:

- `GET/POST /states`
- `GET/PUT/DELETE /states/:id`
- `PATCH /states/:id/activate`
- `PATCH /states/:id/deactivate`
- `GET /states/:stateId/cities`
- `GET/POST /cities`
- `GET/PUT/DELETE /cities/:id`
- `PATCH /cities/:id/activate`
- `PATCH /cities/:id/deactivate`
- `GET/POST /franchise-units`
- `GET/PUT /franchise-units/:id`
- `PATCH /franchise-units/:id/activate`
- `PATCH /franchise-units/:id/deactivate`
- `PATCH /franchise-units/:id/equipment/:equipmentId`
- `PUT /franchise-units/:id/working-hours`
- `GET /franchise-units/:id/staff`
- `POST /franchise-units/:id/staff`
- `PATCH /franchise-units/:id/staff/:staffId/activate`
- `PATCH /franchise-units/:id/staff/:staffId/deactivate`

Planos/portes:

- `GET/POST /plans`
- `GET/PUT /plans/:id`
- `PATCH /plans/:id/activate`
- `PATCH /plans/:id/deactivate`
- `GET /plans/:planId/vehicle-size-prices`
- `POST /plans/:planId/vehicle-size-prices`
- `PUT /plans/:planId/vehicle-size-prices/:id`
- `PATCH /plans/:planId/vehicle-size-prices/:id`
- `DELETE /plans/:planId/vehicle-size-prices/:id`
- `GET/POST /vehicle-sizes`
- `GET/PUT /vehicle-sizes/:id`

Clientes/veiculos/assinaturas:

- `POST /customers`
- `PATCH /customers/me`
- `GET /customers`
- `GET/PUT /customers/:id`
- `PATCH /customers/:id/activate`
- `PATCH /customers/:id/block`
- `PATCH /customers/:id/mark-suspect`
- `GET/POST /vehicles`
- `GET/PUT /vehicles/:id`
- `PATCH /vehicles/:id/activate`
- `PATCH /vehicles/:id/deactivate`
- `PATCH /vehicles/:id/set-primary`
- `GET/POST /subscriptions`
- `GET/PUT /subscriptions/:id`

Checkout/billing/wallet:

- `POST /checkout/subscription/preview`
- `POST /checkout/subscription/confirm`
- `POST /billing`
- `GET /billing`
- `GET /billing/my-current`
- `GET /billing/my-history`
- `GET /billing/customer-history`
- `GET/PUT /billing/:id`
- `GET /wallet/me`
- `GET /wallet/me/statement`
- `GET /wallet/customer/:customerId`
- `POST /wallet/movement`

Operacao:

- `GET /operational/reading-fields`
- `POST /operational/shifts/open`
- `GET /operational/shifts`
- `GET /operational/shifts/:id/live-summary`
- `POST /operational/shifts/:id/close`
- `GET /operational/shifts/:id`
- `POST /operational/attendances/manual`
- `PATCH /operational/attendances/:id/complete`
- `PATCH /operational/attendances/:id/cancel`
- `GET /operational/my-attendances`
- `GET /operational/plate-check/:plate`
- `POST /operational/plate-check/:plate/confirm-wash`
- `GET /operational/closures`
- `GET /operational/closures/:id`
- `POST /operational/daily-washes/:id/cancel`

ANPR:

- `POST /anpr/webhook`
- `GET /anpr/events/:franchiseUnitId`

Parceiros/campanhas/referrals/notificacoes:

- `GET/POST /partners`
- `GET/PUT /partners/:id`
- `PATCH /partners/:id/activate`
- `PATCH /partners/:id/deactivate`
- `POST /partners/:id/transactions/preview`
- `POST /partners/:id/transactions/confirm`
- `POST /partners/:id/transactions/create-qr`
- `GET/POST /campaigns`
- `GET /campaigns/app/active`
- `GET/PUT /campaigns/:id`
- `POST /campaigns/:id/view`
- `POST /campaigns/:id/click`
- `POST /campaigns/:id/dismiss`
- `PATCH /campaigns/:id/activate`
- `PATCH /campaigns/:id/deactivate`
- `GET /campaigns/:id/metrics`
- `POST /referrals`
- `GET /referrals/me`
- `GET /referrals/me/tree`
- `GET /referrals/summary/:userId`
- `GET /referrals/tree/:userId`
- `GET /notifications/me`
- `GET /notifications/me/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

Dashboards:

- `GET /admin-dashboard/overview`
- `GET /admin-dashboard/financial`
- `GET /admin-dashboard/alerts`
- `GET /admin-dashboard/operations`
- `GET /admin-dashboard/anpr`
- `GET /franchise-dashboard/overview`
- `GET /franchise-dashboard/financial`
- `GET /franchise-dashboard/operations`
- `GET /franchise-dashboard/alerts`
- `GET /franchise-dashboard/anpr`
- `GET /franchise-dashboard/customers`
- `GET /franchise-dashboard/partners`
- `GET /partner-dashboard/overview`
- `GET /partner-dashboard/financial`
- `GET /partner-dashboard/transactions`
- `GET /partner-dashboard/alerts`
- `GET /partner-dashboard/campaigns`
- `GET /partner-dashboard/customers`

Financeiro/antifraude:

- `GET /financial/overview`
- `GET /financial/float`
- `POST /financial/ledger`
- `GET /financial/ledger`
- `GET /financial/ledger/unit/:unitId`
- `GET /financial/franchise-rules`
- `POST /financial/franchise-rules`
- `PUT /financial/franchise-rules/:id`
- `GET /financial/rules/:unitId`
- `PUT /financial/rules/:unitId`
- `GET /financial/franchise-reports`
- `POST /financial/franchise-reports/generate`
- `POST /financial/franchise-reports/:id/close`
- `GET /antifraud/security-logs`
- `POST /antifraud/flags`
- `GET /antifraud/flags`
- `GET /antifraud/flags/:id`
- `PATCH /antifraud/flags/:id/review`
- `PUT /antifraud/flags/:id/resolve`
- `POST /antifraud/users/:userId/mark-suspect`
- `POST /antifraud/users/:userId/block`
- `POST /antifraud/users/:userId/unblock`

Sempre confira controllers atuais se houver divergencia com README antigo.

## 14. Dashboard web

Diretorio: `uau-web-dashboard`

Responsabilidade:

- Super Admin
- Franqueado
- Parceiro
- Operador

Rotas principais:

- `/login`
- `/admin`
- `/admin/settings`
- `/admin/plans`
- `/admin/vehicle-sizes`
- `/admin/locations`
- `/admin/partners`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/campaigns`
- `/admin/financial`
- `/admin/antifraud`
- `/admin/operations`
- `/admin/units/staff`
- `/franchise`
- `/franchise/customers`
- `/franchise/customers/[id]`
- `/franchise/operations`
- `/franchise/staff`
- `/partner`
- `/operator`
- `/operator/plate-check`
- `/operator/shifts`
- `/operator/anpr`
- `/privacidade`
- `/suporte`

Redirecionamento por role:

- `SUPER_ADMIN` -> `/admin`
- `FRANCHISE_OWNER` -> `/franchise`
- `PARTNER` -> `/partner`
- `OPERATOR` -> `/operator`

Componentes/padroes:

- API clients em `src/features/*/*.api.ts`
- Componentes base em `src/components`
- CRUD compartilhado em `src/features/crud`
- `DashboardLayout` e `ProtectedRoute` cuidam do layout/protecao
- `middleware.ts` protege server-side por cookie/role
- Usar loading, empty e error states
- Dashboard deve ser denso, utilitario e operacional, nao landing page

Melhorias historicas de UI:

- Layout responsivo com drawer mobile.
- Tabelas devem virar cards no mobile quando necessario.
- Masks manuais sem novas deps para CPF, telefone, placa, CEP.
- Skeleton loading, Toast e StatusBadge padronizados.
- Tokens de marca: `uau-primary #009688`, `uau-primaryDark #00796B`, `uau-green #0BA95B`, `uau-danger #D92D20`, `uau-amber #F59E0B`.

## 15. Mobile app

Diretorio: `uau-mobile-app`

Responsabilidade: assinante/cliente.

Rotas/telas:

- `/`
- `/(auth)/login`
- `/(auth)/register`
- `/(auth)/forgot-password`
- `/(auth)/reset-password`
- `/(tabs)/home`
- `/(tabs)/billing`
- `/(tabs)/wallet`
- `/(tabs)/partners`
- `/(tabs)/profile`
- `/subscribe`
- `/vehicles`
- `/history`
- `/notifications`
- `/referrals`
- `/partners/[id]`
- `/units`
- `/units/[id]`

Fluxos:

- Login/cadastro
- Home conectada
- Wallet/cashback
- Billing
- Assinatura em etapas
- Parceiros
- Minha rede/MMN
- Veiculos
- Historico
- Notificacoes
- Perfil

Padroes:

- Token JWT salvo com Expo SecureStore.
- Axios injeta `Authorization: Bearer`.
- Em `401`, limpar sessao.
- Erros de conectividade devem usar mensagens amigaveis via NetInfo.
- React Query para chamadas.
- Mobile nao deve receber dashboards administrativos.

Publicacao lojas:

- App: UAU+ Lavacar
- Bundle/package: `com.uauplus.mobile`
- Versao documentada: `1.0.0`, versionCode `1`
- Expo SDK 54, RN 0.81.5, `newArchEnabled=false`
- Corrigir `owner` no `app.json` antes de publicar.
- Adicionar metadata `privacy: public` se ainda nao houver.
- Politica de privacidade e URL de suporte sao obrigatorias.
- Play Console exige conta, service account JSON e AAB.
- App Store exige Apple Developer, Bundle ID, screenshots, conta demo e privacy manifest.
- Usar EAS builds preview antes de producao.
- Nao commitar `google-play-service-account.json`.

## 16. Testes

Backend:

```bash
cd uau-core-backend
npm run typecheck
npm test
```

Specs existentes/documentadas:

- `src/anpr/anpr.controller.spec.ts`
- `src/asaas/asaas.service.spec.ts`
- `src/checkout/checkout.service.spec.ts`
- `src/franchise-units/franchise-units.service.spec.ts`
- `src/operations/operations.service.spec.ts`
- `src/referrals/referrals.service.spec.ts`
- `src/subscriptions/subscriptions.service.spec.ts`

Padrao de teste backend:

- Jest serial (`maxWorkers=1`)
- `src/test/setup.ts` carrega envs minimas
- `src/test/helpers.ts` tem factories e `TestCleanup`
- Dependencias externas como Asaas devem ser mockadas quando possivel
- Banco real/dev exige cleanup cuidadoso por FK

Dashboard:

```bash
cd uau-web-dashboard
npm run typecheck
npm test
```

Testes:

- auth route
- auth session route
- middleware

Mobile:

```bash
cd uau-mobile-app
npm run typecheck
```

Expo:

```bash
npx expo-doctor
```

## 17. Staging, deploy e producao

Staging recomendado:

- Render para backend/PostgreSQL.
- Vercel para dashboard.
- API staging: `https://api-staging.seudominio.com/api/v1`
- Dashboard staging: `https://dashboard-staging.seudominio.com`
- Asaas sandbox.
- Swagger pode ficar habilitado em staging.
- Banco separado de producao.
- `JWT_SECRET` diferente de dev/producao.

Render backend:

- Root Directory: `uau-core-backend`
- Build: `npm install && npm run prisma:generate && npm run build`
- Start: `npm run start:prod`
- Migrations no shell: `npm run prisma:deploy`
- Seed se necessario: `npm run seed`

Vercel dashboard:

- Root Directory: `uau-web-dashboard`
- Env: `NEXT_PUBLIC_API_URL=https://api-staging.seudominio.com/api/v1`
- Build: `npm run build`

Producao:

1. Validar staging ponta a ponta.
2. Provisionar PostgreSQL gerenciado com backup.
3. Configurar dominios e SSL.
4. Configurar secrets em plataforma segura.
5. Deploy backend.
6. Rodar `npm run prisma:deploy`.
7. Rodar seed inicial se necessario.
8. Smoke test backend.
9. Deploy dashboard.
10. Validar login por perfil.
11. Build mobile interno/homologacao.
12. Configurar Asaas producao e webhook.
13. Rodar smoke test pos-deploy.
14. Go-live controlado.

Go-live controlado:

- Liberar usuarios internos primeiro.
- Testar 1 unidade, 1 plano, 1 cobranca.
- Testar baixa manual e ANPR simulado.
- Testar parceiro, financeiro, wallet e historico.
- Monitorar logs, webhooks, cobrancas, wallet, cashback, MMN, ledger, expedientes, ANPR e seguranca.

Criterios de parada:

- erro em cobranca real;
- webhook duplicado/perdido;
- divergencia financeira;
- login quebrado;
- baixa de lavagem falhando;
- CORS em producao;
- picos de 5xx.

## 18. Smoke tests

Pos-deploy:

- `GET /api/v1/health`
- Login Super Admin
- Login cliente
- `GET /admin-dashboard/overview`
- `GET /financial/overview`
- Criar/validar cliente teste
- Criar veiculo
- Preview assinatura
- Confirmar checkout PIX
- Conferir Asaas
- Simular/aguardar webhook
- Conferir billing e subscription
- Validar placa no operador
- Confirmar baixa manual
- Verificar bloqueio por uso diario
- Testar parceiro preview/confirm
- Conferir cashback/ledger
- Abrir rotas dashboard por perfil

Observacao: docs antigos citam `/health/ready`. Se precisar de readiness real, implementar endpoint dedicado.

## 19. Rollback e incidente

Em falha critica:

1. Fazer rollback para deploy anterior na plataforma.
2. Confirmar `GET /api/v1/health`.
3. Validar login Super Admin e cliente.
4. Pausar webhooks Asaas no painel.
5. Registrar horario da pausa.
6. Preservar logs/eventos para reprocessamento.
7. Bloquear novos checkouts:
   - desabilitar planos;
   - remover CTA;
   - feature flag/env se existir;
   - orientar suporte.
8. Nao apagar assinaturas/cobrancas existentes.
9. Manter app/build anterior ativo.
10. Restaurar backup somente em incidente de dados confirmado.

Restauracao de backup:

1. Colocar app em manutencao.
2. Pausar webhooks Asaas.
3. Capturar snapshot do estado atual.
4. Restaurar backup validado.
5. Rodar integridade.
6. Reativar API.
7. Reprocessar webhooks/eventos com cuidado.

Encerrar rollback quando:

- API saudavel.
- Login Super Admin e cliente OK.
- Webhooks OK.
- Cobrancas conferidas.
- Ledger/financeiro sem divergencia critica.
- Operacao/baixa manual OK.
- Equipe avisada.

## 20. Auditoria e riscos

Auditoria historica registrou:

- Backend build/typecheck/openapi passaram.
- Mobile typecheck e expo-doctor passaram.
- Dashboard typecheck/build passaram, com necessidade de permissao elevada em sandbox para Next em uma execucao.
- Prisma validate falhou sem `DATABASE_URL`, passou com env temporaria.
- Smoke test falhou quando API nao estava rodando.
- Nao foram encontrados segredos reais em arquivos versionaveis durante busca feita na epoca.
- `.env` local existe em alguns projetos; garantir `.gitignore`.

Vulnerabilidades npm historicas:

- Backend: 22 vulnerabilidades, algumas exigiam upgrades breaking para Nest 11.
- Mobile: 8 vulnerabilidades, cadeia Expo/Metro/CLI.
- Dashboard: 2 moderadas via PostCSS/Next.
- Nao rodar `npm audit fix --force` sem janela e teste regressivo.

Pendencias antes de producao:

- Confirmar health/readiness exigidos pela plataforma.
- Usar `prisma migrate deploy`, nao `migrate dev`.
- Resolver/aceitar formalmente vulnerabilidades.
- Configurar backups e testar restore.
- Validar todos os perfis.
- Validar Asaas producao e webhooks ponta a ponta.
- Build mobile interno Android/iOS.

## 21. Specs historicas importantes

Auth HTTP-only cookie:

- Problema: JWT em localStorage era exposto a XSS.
- Decisao: cookie HTTP-only + token em memoria.
- Backend permanece com Bearer JWT, sem `credentials: include`.
- Arquivos principais: `src/app/api/auth/route.ts`, `src/app/api/auth/session/route.ts`, `src/middleware.ts`, `src/auth/auth.store.ts`, `src/auth/auth.api.ts`.

Unit Staff API:

- Tudo dentro de `franchise-units`.
- Sem novo modulo.
- `UnitStaff.role` e string com valores `"MANAGER"` ou `"OPERATOR"`.
- Roles permitidas: `SUPER_ADMIN`, `FRANCHISE_OWNER`.
- FRANCHISE_OWNER so gerencia sua unidade.
- Endpoints:
  - `GET /franchise-units/:id/staff`
  - `POST /franchise-units/:id/staff`
  - `PATCH /franchise-units/:id/staff/:staffId/activate`
  - `PATCH /franchise-units/:id/staff/:staffId/deactivate`

Planos por porte e dashboards:

- `PlanVehicleSizePrice` ja existe no schema.
- Rotas sob `/plans/:planId/vehicle-size-prices`.
- Campanhas podem ter `partnerId`.
- Dashboards devem filtrar dados pelo usuario autenticado.
- `User.defaultUnitId` e usado em alguns fluxos de franchise owner.

Operacao:

- Frontend chama `/operational`, nao `/operations`.
- DTO de abrir turno usa `unitId`.
- DTO de fechar turno usa `closingReadings` e `closingNotes`.

Testes de integracao:

- Fluxos criticos: checkout, webhook Asaas, referrals/MMN, ANPR/IDOR.
- Checkout deve ficar `PENDING` ate webhook.
- Referrals tinha risco de raw SQL com tabela errada; conferir atual.

## 22. Backfill vehicleId e suporte

Durante migracao legado:

- Subscriptions antigas foram importadas sem `vehicleId`.
- 391 casos tiveram associacao automatica confiavel.
- Alguns casos foram associados por criterio arbitrario: veiculo mais recentemente cadastrado na data da migracao.
- Se cliente reclamar que o sistema rejeita carro errado, corrigir `vehicleId` da Subscription via painel admin e marcar `isPrimary=true` no veiculo correto.
- Existem 2 clientes documentados sem veiculo cadastrado; a assinatura permanece com `vehicleId=NULL` e lavagem deve bloquear ate cadastro manual.

Ao mexer em assinatura/veiculo:

- Preserve compatibilidade com subscriptions antigas.
- Cuidado com clientes multi-veiculo.
- Nao assumir que toda subscription tem `vehicleId`.

## 23. Pontos de atencao para qualquer GPT

- Docs antigos podem estar parcialmente desatualizados; sempre confira codigo atual.
- `uau-clube-api` nao e backend oficial.
- CORS exige `ALLOWED_ORIGINS`.
- `RATE_LIMIT_TTL` atual e em milissegundos.
- `DIRECT_URL` pode ser exigido pelo Prisma.
- Login bloqueia usuarios sem `betaAccess`, exceto Super Admin.
- Envelope da API e contrato dos frontends.
- Mobile deve ficar cliente-only.
- Dashboard README cita alguns endpoints antigos de ANPR/vehicle-size/referrals; conferir controllers.
- Webhook Asaas e financeiro sao areas de alto risco.
- Nao mexer em Asaas/checkout/wallet sem testes.
- Nao quebrar trava de uma lavagem por veiculo/dia.
- Mudancas em roles exigem ajuste backend + middleware + layouts + rotas.
- Nao commitar `.env`, service account JSON, keystores ou segredos.
- Antes de lojas mobile, corrigir `owner`, politica de privacidade, suporte, screenshots e conta demo.

## 24. Checklist rapido por tipo de tarefa

Nova feature backend:

- Conferir schema e modulo existente.
- Criar/ajustar DTO.
- Implementar service.
- Expor controller com roles corretas.
- Atualizar cliente web/mobile se necessario.
- Testar typecheck e Jest focado.

Nova tela dashboard:

- Conferir role e rota.
- Usar `DashboardLayout`.
- Criar API client em `src/features`.
- Usar React Query/Zustand conforme padrao.
- Implementar loading/error/empty.
- Garantir responsivo mobile.

Nova tela mobile:

- Manter foco em cliente.
- Usar Expo Router.
- Criar API/hook em `src/features`.
- Tratar connectivity errors.
- Usar estados vazios.

Deploy/staging:

- Conferir scripts reais.
- Usar `prisma:deploy`.
- Configurar envs por plataforma.
- Rodar smoke tests.
- Validar Asaas sandbox/producao conforme ambiente.

Incidente:

- Pausar webhooks.
- Bloquear checkouts.
- Preservar logs.
- Rollback plataforma.
- Restaurar backup so com incidente de dados confirmado.

