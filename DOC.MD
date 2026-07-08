# DOC.MD - Contexto Completo do Projeto UAU+ Lavacar

> Documento criado para alimentar outro ChatGPT/Codex com o contexto do projeto. Use este arquivo como briefing inicial antes de pedir novas funcionalidades, correcoes ou revisoes.

## 1. Resumo executivo

O UAU+ Lavacar e um monorepo com tres produtos principais:

- `uau-core-backend`: API principal em NestJS, Prisma e PostgreSQL.
- `uau-web-dashboard`: dashboard web em Next.js para Super Admin, franqueado, parceiro e operador.
- `uau-mobile-app`: app mobile Expo/React Native para cliente/assinante.

O dominio do sistema cobre assinatura de lavagens, gestao de unidades/franquias, planos por cobertura e porte de veiculo, cobrancas Asaas, carteira/cashback, bonus de boas-vindas, indicacoes/MMN, parceiros, operacao de lavacar, leitura de placas/ANPR, antifraude, relatorios financeiros e notificacoes.

O backend expoe rotas com prefixo global:

```text
/api/v1
```

As respostas da API seguem envelope padrao:

```json
{
  "success": true,
  "data": {}
}
```

Erros tambem sao tratados por filtro global e os frontends esperam mensagens em `error.message`.

## 2. Estrutura do repositorio

```text
.
|-- uau-core-backend/      # Backend oficial NestJS + Prisma
|-- uau-web-dashboard/     # Dashboard web Next.js
|-- uau-mobile-app/        # App mobile Expo/React Native
|-- docs/superpowers/      # Specs e planos historicos de implementacao
|-- ARCHITECTURE_SUMMARY.md
|-- PROJECT_STRUCTURE.md
|-- DEPLOYMENT_GUIDE.md
|-- PRODUCTION_CHECKLIST.md
|-- FINAL_AUDIT_REPORT.md
`-- DOC.MD                 # Este documento
```

Notas importantes:

- O backend oficial fica em `uau-core-backend`.
- O mobile oficial fica em `uau-mobile-app`.
- O dashboard oficial fica em `uau-web-dashboard`.
- Existem arquivos de producao/staging na raiz que documentam deploy, smoke test e rollback.

## 3. Stack tecnica

Backend:

- NestJS 10
- TypeScript
- Prisma 5
- PostgreSQL, com exemplos apontando para Supabase/Postgres
- JWT com Passport
- bcrypt
- class-validator/class-transformer
- Swagger/OpenAPI opcional
- Helmet
- Throttler/rate limit
- nestjs-pino
- Nodemailer/Resend SMTP
- Asaas para pagamentos
- Jest para testes

Dashboard web:

- Next.js 15 App Router
- React 19
- TypeScript
- TailwindCSS
- Axios
- TanStack React Query
- Zustand
- React Hook Form
- Zod
- Lucide React
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
- Sentry React Native configurado no `app.json`

## 4. Como rodar localmente

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

Observacao: se backend e dashboard tentarem usar a porta `3000`, rode o dashboard em `3001`.

## 5. Variaveis de ambiente principais

Backend (`uau-core-backend/.env.example`):

- `DATABASE_URL`
- `DIRECT_URL` no schema Prisma, embora o exemplo atual destaque principalmente `DATABASE_URL`
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
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_NAME`

Dashboard:

- `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1`
- variavel de assinatura de sessao usada por `src/lib/session.ts`, se exigida pelo ambiente atual.

Mobile:

- `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1`
- `EXPO_PUBLIC_SENTRY_DSN` opcional. Se nao existir, o app roda normalmente sem inicializar Sentry.

No Android Emulator, usar:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1
```

No celular fisico via Expo Go, usar IP LAN da maquina.

## 6. Backend - arquitetura

Entrada principal:

- `uau-core-backend/src/main.ts`
- `uau-core-backend/src/app.module.ts`

Configuracoes globais:

- Prefixo global: `api/v1`.
- CORS exige `ALLOWED_ORIGINS`; sem essa variavel o app falha ao iniciar.
- Helmet ativo.
- `ValidationPipe` global com `whitelist`, `transform` e `forbidNonWhitelisted`.
- `ResponseEnvelopeInterceptor` envelopa respostas em `{ success, data }`.
- `GlobalExceptionFilter` padroniza erros.
- Swagger fica em `/api/docs` quando `ENABLE_SWAGGER=true`.
- Guards globais: `ThrottlerGuard`, `JwtAuthGuard`, `RolesGuard`.
- Rotas publicas usam decorator `@Public()`.

Modulos carregados:

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

## 7. Autenticacao e roles

Roles no Prisma:

- `SUPER_ADMIN`
- `FRANCHISE_OWNER`
- `PARTNER`
- `OPERATOR`
- `CUSTOMER`

Status de usuario:

- `ACTIVE`
- `BLOCKED`
- `SUSPECT`
- `INACTIVE`

Fluxo de login:

- `POST /api/v1/auth/login`
- Busca usuario por e-mail.
- Confere senha com bcrypt.
- Rejeita usuario nao ativo.
- Rejeita usuario sem `betaAccess`, exceto `SUPER_ADMIN`.
- Gera JWT com `sub`, `email`, `role` e `jti`.
- Retorna `{ accessToken, user }`.

Fluxos adicionais:

- `POST /auth/logout`: revoga `jti` em `RevokedToken`.
- `POST /auth/forgot-password`: gera codigo de 6 digitos, envia e-mail e retorna `resetToken`.
- `POST /auth/reset-password`: valida token e codigo, troca senha, revoga token usado.
- `POST /auth/change-password`: exige senha atual.

No dashboard web existe uma camada Next:

- `src/app/api/auth/route.ts`: faz login contra backend, assina sessao e grava cookie HTTP-only.
- `src/app/api/auth/session/route.ts`: le sessao do cookie e devolve access token + user.
- `src/middleware.ts`: protege rotas por role.

Atencao: o cliente Axios do dashboard ainda pega token via `auth-session` configuravel em runtime. Ao mexer em auth, manter coerencia entre cookie HTTP-only, store Zustand e interceptors.

## 8. Banco de dados e principais modelos

Schema: `uau-core-backend/prisma/schema.prisma`

Modelos centrais:

- `User`: usuario base, role, status, betaAccess e defaultUnit.
- `Customer`: perfil de cliente, CPF, telefone, Asaas customer, referral code.
- `Vehicle`: veiculos do cliente, placa unica, marca, modelo, cor, porte e primario.
- `Plan`: planos, preco, cobertura, dias/horarios permitidos, periodicidade, maxVehicles e precificacao por porte.
- `PlanAvailability`: disponibilidade por estado, cidade ou unidade.
- `VehicleSizeCategory`: categorias de porte.
- `VehicleModelSizeRule`: regra marca/modelo -> porte.
- `PlanVehicleSizePrice`: preco do plano por porte.
- `Subscription`: assinatura vinculada a cliente, plano e opcionalmente veiculo.
- `BillingHistory`: cobrancas, status, invoice, PIX, boleto e relacao com Asaas.
- `Wallet`: saldos `balance`, `promoBalance`, `blockedBalance`, `welcomeBonusBalance`.
- `WalletMovement`: extrato da carteira.
- `FranchiseUnit`: unidade/franquia, endereco, telefone, imagem, flags owned/franchise.
- `UnitStaff`: vinculo de usuarios a unidades.
- `Shift`, `ShiftClosure`, `Attendance`, `DailyWash`: operacao do lavacar.
- `AnprCamera`, `AnprEvent`: leitura de placas.
- `Partner`, `PartnerTransaction`: parceiros e transacoes com cashback/comissao.
- `Campaign`: campanhas.
- `FinancialLedger`, `FranchiseRule`, `FranchiseReport`: financeiro.
- `AntiFraudFlag`, `SecurityLog`: antifraude e auditoria.
- `Referral`: rede de indicacao.
- `WelcomeBonusGrant`: controle de bonus de boas-vindas.
- `Notification`: notificacoes.
- `WashService`, `IndividualServicePurchase`, `IndividualServicePurchaseItem`: servicos avulsos.
- `RevokedToken`: revogacao de JWT/reset token.

## 9. Regras de negocio principais

Assinaturas e planos:

- Planos podem ser mensais, trimestrais, semestrais ou anuais.
- Plano pode ter preco unico ou preco por porte do veiculo.
- Quando `useVehicleSizePricing=false`, usa `Plan.price`.
- Quando `useVehicleSizePricing=true`, resolve porte do veiculo e busca preco ativo em `PlanVehicleSizePrice`.
- Assinatura ativa ou em atraso por veiculo bloqueia nova assinatura para o mesmo veiculo.
- Assinaturas mensais usam subscription recorrente no Asaas.
- Planos nao mensais usam cobranca unica no Asaas.

Checkout:

- `POST /checkout/subscription/preview` calcula plano, cashback utilizavel e valor de gateway.
- `POST /checkout/subscription/confirm` cria cliente/cobranca no Asaas antes da transacao DB.
- DB transaction cria subscription, billing e debita cashback de forma atomica.
- Se Asaas cobrou e a transacao DB falhou, o service loga IDs criticos para reconciliacao manual.
- Se cashback cobrir integralmente, o metodo aceito e PIX e a cobranca minima enviada ao gateway e `0.01`.

Asaas:

- `AsaasService` cria clientes, subscriptions, payments e busca QR Code PIX.
- Webhook processa `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`, `PAYMENT_CANCELLED`, `SUBSCRIPTION_DELETED` e `SUBSCRIPTION_INACTIVATED`.
- Pagamento confirmado marca billing como `PAID`, subscription como `ACTIVE`, define `startedAt` e `expiresAt`.
- Pagamento atrasado marca billing/subscription como `OVERDUE`.
- Cancelamentos marcam billing/subscription como `CANCELLED`.
- Webhook e idempotente para pagamentos ja processados.

Wallet/cashback:

- Carteira separa saldo real, promocional, bloqueado e bonus de boas-vindas.
- Uso de cashback em assinatura debita primeiro conforme utilitario de checkout.
- Movimentos sao registrados em `WalletMovement`.
- Bonus de indicacao credita `promoBalance` do indicador quando o indicado ativa a primeira assinatura.

Bonus de boas-vindas:

- Settings seedados: `WELCOME_BONUS_AMOUNT=21.00`, `WELCOME_BONUS_DAILY_DECAY=3.00`.
- Cron diario em `America/Fortaleza`.
- Decaimento reduz saldo esperado por dia desde `grantedAt`.
- Se usuario ja gastou mais que o decaimento, nao reduz abaixo do que sobrou.
- Quando chega a zero, marca `fullyExpiredAt`.

Operacao/lavagens:

- Operador abre turno por unidade.
- So pode haver um turno aberto por unidade.
- Operador com role `OPERATOR` precisa pertencer a unidade via `UnitStaff`.
- Baixa manual cria attendance.
- Checagem de placa busca veiculo, assinatura ativa, assinatura atrasada e lavagem do dia.
- Confirmacao de lavagem exige assinatura ativa e nao expirada.
- `DailyWash` tem unique por `vehicleId + date`, impedindo mais de uma lavagem/dia.
- Fechamento cria `ShiftClosure` com total de lavagens completadas.

ANPR:

- Webhook ANPR registra eventos de placa.
- Eventos podem classificar placa como autorizada, bloqueada, avulsa, suspeita ou desconhecida.
- Dashboard de operador tem paginas de ANPR e checagem de placa.

Parceiros:

- Parceiro possui percentuais de cashback gerado, cashback para cliente, comissao UAU e limite de cashback aceito.
- App mobile lista parceiros e permite preview/confirmacao de transacao.
- Cashback usado no parceiro funciona como desconto operacional do parceiro.
- Cashback novo incide sobre valor pago via PIX/cartao.

Indicacoes/MMN:

- `Referral` liga indicador a indicado.
- Mobile mostra resumo, linhas e arvore em ate 3 niveis.
- Bonus e concedido na primeira assinatura ativa do indicado.

## 10. Endpoints principais

Todos abaixo assumem prefixo `/api/v1`.

Auth:

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`

Usuario:

- `GET /users/me`
- `PATCH /users/:id/beta-access`

Localizacao/unidades:

- `GET /states`
- `POST /states`
- `PUT /states/:id`
- `PATCH /states/:id/activate`
- `PATCH /states/:id/deactivate`
- `GET /states/:stateId/cities`
- `GET /cities`
- `POST /cities`
- `PUT /cities/:id`
- `PATCH /cities/:id/activate`
- `PATCH /cities/:id/deactivate`
- `GET /franchise-units`
- `POST /franchise-units`
- `PUT /franchise-units/:id`
- `PATCH /franchise-units/:id/activate`
- `PATCH /franchise-units/:id/deactivate`
- `PUT /franchise-units/:id/working-hours`
- `GET /franchise-units/:id/staff`
- `POST /franchise-units/:id/staff`

Planos e portes:

- `GET /plans`
- `POST /plans`
- `PUT /plans/:id`
- `PATCH /plans/:id/activate`
- `PATCH /plans/:id/deactivate`
- `GET /plans/:planId/vehicle-size-prices`
- `POST /plans/:planId/vehicle-size-prices`
- `PUT /plans/:planId/vehicle-size-prices/:id`
- `DELETE /plans/:planId/vehicle-size-prices/:id`
- `GET /vehicle-sizes`
- `POST /vehicle-sizes`
- `PUT /vehicle-sizes/:id`

Clientes, veiculos e assinaturas:

- `POST /customers`
- `PATCH /customers/me`
- `GET /customers`
- `GET /customers/:id`
- `PUT /customers/:id`
- `PATCH /customers/:id/activate`
- `PATCH /customers/:id/block`
- `PATCH /customers/:id/mark-suspect`
- `GET /vehicles`
- `POST /vehicles`
- `PUT /vehicles/:id`
- `PATCH /vehicles/:id/activate`
- `PATCH /vehicles/:id/deactivate`
- `PATCH /vehicles/:id/set-primary`
- `GET /subscriptions`
- `POST /subscriptions`
- `PUT /subscriptions/:id`

Checkout/cobranca:

- `POST /checkout/subscription/preview`
- `POST /checkout/subscription/confirm`
- `GET /billing/my-current`
- `GET /billing/my-history`
- `GET /billing/customer-history`

Wallet:

- `GET /wallet/me`
- `GET /wallet/me/statement`
- `GET /wallet/customer/:customerId`
- `POST /wallet/movement`

Operacao:

- `GET /operational/reading-fields`
- `POST /operational/shifts/open`
- `GET /operational/shifts`
- `GET /operational/shifts/:id`
- `GET /operational/shifts/:id/live-summary`
- `POST /operational/shifts/:id/close`
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

Parceiros:

- `GET /partners`
- `POST /partners`
- `PUT /partners/:id`
- `PATCH /partners/:id/activate`
- `PATCH /partners/:id/deactivate`
- `POST /partners/:id/transactions/preview`
- `POST /partners/:id/transactions/confirm`
- `POST /partners/:id/transactions/create-qr`

Campanhas/notificacoes/referrals:

- `GET /campaigns`
- `GET /campaigns/app/active`
- `POST /campaigns/:id/view`
- `POST /campaigns/:id/click`
- `POST /campaigns/:id/dismiss`
- `GET /notifications/me`
- `GET /notifications/me/unread-count`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `POST /referrals`
- `GET /referrals/me`
- `GET /referrals/me/tree`
- `GET /referrals/summary/:userId`
- `GET /referrals/tree/:userId`

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

## 11. Dashboard web

Diretorio: `uau-web-dashboard`

Objetivo: portal web multi-role para operacao e administracao.

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

Arquivos importantes:

- `src/api/client.ts`: Axios, base URL, Authorization e tratamento de erro.
- `src/auth/auth.store.ts`: estado de autenticacao.
- `src/auth/auth-session.ts`: ponte de token/logout.
- `src/layout/DashboardLayout.tsx`: layout protegido.
- `src/layout/ProtectedRoute.tsx`: protecao client-side.
- `src/middleware.ts`: protecao server-side por cookie/role.
- `src/features/crud/*`: componentes reutilizaveis de CRUD.
- `src/features/*/*.api.ts`: clientes por dominio.

## 12. Mobile app

Diretorio: `uau-mobile-app`

Objetivo: app do assinante/cliente.

Rotas/telas:

- `(auth)/login`
- `(auth)/register`
- `(auth)/forgot-password`
- `(auth)/reset-password`
- `(tabs)/home`
- `(tabs)/billing`
- `(tabs)/wallet`
- `(tabs)/partners`
- `(tabs)/profile`
- `/subscribe`
- `/vehicles`
- `/history`
- `/notifications`
- `/referrals`
- `/partners/[id]`
- `/units`
- `/units/[id]`

Fluxos principais:

- Login/cadastro.
- Home conectada com usuario, wallet, billing, campanhas e notificacoes.
- Assinatura em etapas: estado, cidade, unidade, plano, veiculo, metodo, preview, confirmacao.
- Wallet e extrato.
- Billing atual e historico.
- Parceiros e transacoes com cashback.
- Minha rede/MMN.
- Veiculos.
- Historico de atendimentos.
- Perfil.

Arquivos importantes:

- `src/api/client.ts`: Axios com timeout, Authorization e mensagens de conectividade via NetInfo.
- `src/auth/auth.store.ts`: sessao salva com SecureStore.
- `src/store/query-client.ts`: React Query.
- `src/components/*`: componentes visuais base.
- `src/features/*`: APIs, hooks e componentes por dominio.
- `app/_layout.tsx`: inicializa providers e Sentry somente quando `EXPO_PUBLIC_SENTRY_DSN` existe.
- `app.json`: metadados Expo, bundle/package id, `privacy: public`, splash, plugin Sentry e EAS project id.
- `eas.json`: perfis de build com `EXPO_PUBLIC_API_URL` e placeholder vazio para `EXPO_PUBLIC_SENTRY_DSN`.

Publicacao mobile:

- `owner` no `app.json` ainda precisa ser trocado de `dev-machine` para o usuario real Expo antes de publicar.
- `EXPO_PUBLIC_API_URL` deve apontar para o dominio definitivo da API em staging/producao.
- `EXPO_PUBLIC_SENTRY_DSN` deve ser configurado no EAS/ambiente sem commitar segredo real.
- Guia de publicacao: `uau-mobile-app/PUBLICACAO_STORES.md`.

## 13. Seeds e configuracoes iniciais

Seed principal:

```bash
cd uau-core-backend
npm run seed
```

O seed:

- Exige `SUPER_ADMIN_PASSWORD`.
- Exige senha com no minimo 12 caracteres.
- Cria ou reaproveita Super Admin por `SUPER_ADMIN_EMAIL`.
- Cria settings padrao:
  - `platformName`
  - `cashbackExpiryDays`
  - `maxWashesPerDay`
  - `WELCOME_BONUS_AMOUNT`
  - `WELCOME_BONUS_DAILY_DECAY`
  - `REFERRAL_BONUS_AMOUNT`

## 14. Testes e validacao

Backend:

```bash
cd uau-core-backend
npm run typecheck
npm test
```

Para desenvolvimento local com banco isolado de teste:

```bash
cd uau-core-backend
npm run prisma:deploy:test
npm run test:local
```

Notas:

- `src/test/setup.ts` carrega `.env.test` e aceita `TEST_DATABASE_URL`.
- Quando `TEST_DATABASE_URL` existe, ele sobrescreve `DATABASE_URL` e `DIRECT_URL` nos testes.
- `npm test` nao deve usar banco real por acidente; prefira `npm run test:local` com Postgres local/Docker.
- `cleanup.flush` foi protegido via helpers para evitar falhas em cascata quando `beforeAll` falha.

Specs existentes:

- `src/anpr/anpr.controller.spec.ts`
- `src/asaas/asaas.service.spec.ts`
- `src/checkout/checkout.service.spec.ts`
- `src/franchise-units/franchise-units.service.spec.ts`
- `src/operations/operations.service.spec.ts`
- `src/referrals/referrals.service.spec.ts`
- `src/subscriptions/subscriptions.service.spec.ts`

Dashboard:

```bash
cd uau-web-dashboard
npm run typecheck
npm test
```

Testes existentes:

- `src/__tests__/api/auth-session.test.ts`
- `src/__tests__/api/auth.test.ts`
- `src/__tests__/middleware.test.ts`

Mobile:

```bash
cd uau-mobile-app
npm run typecheck
```

## 15. Padroes de implementacao

Backend:

- Usar DTOs com `class-validator`.
- Respeitar roles com decorators/guards existentes.
- Manter rotas sob o prefixo global; controllers nao devem incluir `/api/v1`.
- Nao fazer chamadas HTTP externas dentro de transacoes longas do Prisma.
- Para Asaas, preferir criar dados externos antes da transacao DB e logar IDs para reconciliacao se a transacao falhar.
- Retornar objetos simples e deixar interceptor envelopar.
- Usar `PrismaService` e transacoes quando houver escrita multipla dependente.
- Manter idempotencia em webhooks.

Frontend web:

- Usar clients em `src/features/*/*.api.ts`.
- Usar componentes compartilhados em `src/components` e `src/features/crud`.
- Respeitar protecao por role no middleware e no layout.
- Estados de loading, erro e vazio devem existir.
- O dashboard e operacional/administrativo; evitar tela com cara de landing page.

Mobile:

- Usar React Query para chamadas.
- Usar SecureStore/Zustand para sessao.
- Mensagens de conectividade devem seguir o padrao de `src/api/client.ts`.
- Mobile deve permanecer focado no cliente/assinante; dashboards ficam no web.
- Tratar estados vazios sem quebrar a UX.

## 16. Pontos de atencao e possiveis inconsistencias

- Workspace recente pode conter arquivos modificados nao commitados em mobile/config, docs e artefatos locais. Evite reverter mudancas sem revisar.
- O dashboard README cita alguns endpoints antigos de ANPR/vehicle-size/referrals que podem nao bater 100% com os controllers atuais. Conferir controller antes de implementar.
- `schema.prisma` usa `directUrl = env("DIRECT_URL")`; garantir que `DIRECT_URL` exista em ambientes que rodam Prisma se necessario.
- `ALLOWED_ORIGINS` e obrigatorio no backend.
- O login bloqueia usuarios sem `betaAccess`, exceto Super Admin.
- Webhook Asaas deve ser configurado com token/segredo correto e validado no controller.
- Webhook Asaas documentado para producao/staging: `POST /api/v1/asaas/webhook` com header `asaas-access-token=<ASAAS_WEBHOOK_TOKEN>`.
- `findCustomerByCpfCnpj()` deve manter encoding seguro de CPF/CNPJ ao chamar Asaas.
- Ao mexer em assinatura/cobranca, cuidar de consistencia entre Asaas, `Subscription`, `BillingHistory` e wallet.
- `Subscription.vehicleId` deve continuar opcional para compatibilidade com assinaturas legadas/importadas; checkout do cliente continua exigindo `vehicleId`.
- Ao mexer em lavagem por placa, preservar a trava de uma lavagem por veiculo/dia.
- Ao mexer em roles, atualizar backend, dashboard middleware, layouts e rotas.
- Ao alterar envelope de resposta, ajustar web e mobile, pois ambos esperam `{ success, data }` ou `{ success:false, error }`.
- Paginas publicas finais para lojas e clientes: `/privacidade` e `/suporte`; e-mail oficial `contato@uaulavacar.com.br`, WhatsApp `5585986532728`.
- Artefatos locais/gerados como `*.tsbuildinfo` e `.claude/settings.json` nao devem ser tratados como codigo de produto.

## 17. Prompt sugerido para usar no ChatGPT

Cole este `DOC.MD` e depois use algo assim:

```text
Voce e um engenheiro senior trabalhando no projeto UAU+ Lavacar. Antes de propor codigo, leia todo o contexto abaixo. Respeite a arquitetura existente, as roles, o envelope da API, os fluxos de Asaas/wallet/assinatura e os padroes dos frontends.

Tarefa: [descreva aqui o que quero implementar/corrigir]

Ao responder:
- indique arquivos provaveis a alterar;
- explique impactos em backend, dashboard e mobile quando houver;
- preserve compatibilidade com os fluxos descritos;
- sugira testes especificos;
- nao invente endpoints sem conferir os controllers existentes.
```

## 18. Comandos rapidos por tarefa

Instalar tudo separadamente:

```bash
cd uau-core-backend && npm install
cd ../uau-web-dashboard && npm install
cd ../uau-mobile-app && npm install
```

Backend dev:

```bash
cd uau-core-backend
npm run start:dev
```

Dashboard dev:

```bash
cd uau-web-dashboard
npm run dev -- -p 3001
```

Mobile dev:

```bash
cd uau-mobile-app
npm run start
```

Prisma:

```bash
cd uau-core-backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run seed
```

Checks:

```bash
cd uau-core-backend && npm run typecheck && npm test
cd ../uau-web-dashboard && npm run typecheck && npm test
cd ../uau-mobile-app && npm run typecheck
```
