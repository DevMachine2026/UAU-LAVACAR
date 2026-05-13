# UAU+ Web Dashboard

Painel web multiportal da UAU+ para:

- SUPER_ADMIN
- FRANCHISE_OWNER
- PARTNER
- OPERATOR

O app mobile React Native fica focado no assinante/cliente. Este projeto concentra os dashboards administrativos e operacionais.

## Stack

- Next.js
- TypeScript
- TailwindCSS
- Axios
- TanStack React Query
- Zustand
- React Hook Form
- Zod

## Instalar

```bash
npm install
```

## Ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Rodar

```bash
npm run dev
```

Abra:

```text
http://localhost:3000/login
```

Se o backend tambem estiver na porta `3000`, rode o dashboard em outra porta:

```bash
npm run dev -- -p 3001
```

## Redirecionamento por role

- `SUPER_ADMIN` -> `/admin`
- `FRANCHISE_OWNER` -> `/franchise`
- `PARTNER` -> `/partner`
- `OPERATOR` -> `/operator`

## Rotas principais

- `/login`
- `/admin`
- `/admin/settings`
- `/admin/plans`
- `/admin/vehicle-sizes`
- `/admin/locations`
- `/admin/partners`
- `/admin/customers`
- `/admin/campaigns`
- `/admin/financial`
- `/admin/antifraud`
- `/admin/operations`
- `/admin/units/staff`
- `/franchise`
- `/franchise/customers`
- `/franchise/operations`
- `/franchise/staff`
- `/partner`
- `/operator`
- `/operator/plate-check`
- `/operator/shifts`
- `/operator/anpr`

## Endpoints usados

Super Admin:

- `GET /admin-dashboard/overview`
- `GET /admin-dashboard/financial`
- `GET /admin-dashboard/alerts`
- `GET /admin-dashboard/operations`
- `GET /admin-dashboard/anpr`
- `GET /admin-settings`
- `PUT /admin-settings`
- `GET /states`
- `POST /states`
- `PUT /states/:id`
- `PATCH /states/:id/activate`
- `PATCH /states/:id/deactivate`
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
- `GET /plans`
- `POST /plans`
- `PUT /plans/:id`
- `PATCH /plans/:id/activate`
- `PATCH /plans/:id/deactivate`
- `GET /partners`
- `POST /partners`
- `PUT /partners/:id`
- `PATCH /partners/:id/activate`
- `PATCH /partners/:id/deactivate`
- `GET /customers`
- `GET /customers/:id`
- `PUT /customers/:id`
- `PATCH /customers/:id/activate`
- `PATCH /customers/:id/block`
- `PATCH /customers/:id/mark-suspect`
- `GET /vehicles`
- `GET /wallet/:userId`
- `GET /wallet/:userId/statement`
- `GET /billing/my-history?userId=...`
- `GET /operational/my-attendances?userId=...`
- `GET /referrals/user/:userId`
- `GET /referrals/user/:userId/tree`
- `GET /campaigns`
- `POST /campaigns`
- `PUT /campaigns/:id`
- `PATCH /campaigns/:id/activate`
- `PATCH /campaigns/:id/deactivate`
- `GET /campaigns/:id/metrics`
- `GET /financial/overview`
- `GET /financial/ledger`
- `GET /financial/float`
- `GET /financial/franchise-rules`
- `POST /financial/franchise-rules`
- `PUT /financial/franchise-rules/:id`
- `GET /financial/franchise-reports`
- `POST /financial/franchise-reports/generate`
- `POST /financial/franchise-reports/:id/close`
- `GET /antifraud/security-logs`
- `GET /antifraud/flags`
- `GET /antifraud/flags/:id`
- `PATCH /antifraud/flags/:id/review`
- `POST /antifraud/users/:userId/mark-suspect`
- `POST /antifraud/users/:userId/block`
- `POST /antifraud/users/:userId/unblock`

Franqueado:

- `GET /franchise-dashboard/overview`
- `GET /franchise-dashboard/financial`
- `GET /franchise-dashboard/operations`
- `GET /franchise-dashboard/anpr`
- `GET /franchise-dashboard/customers`
- `GET /franchise-dashboard/alerts`

Parceiro:

- `GET /partner-dashboard/overview`
- `GET /partner-dashboard/financial`
- `GET /partner-dashboard/transactions`
- `GET /partner-dashboard/alerts`

Operador:

- `GET /operational/reading-fields`
- `POST /operational/shifts/open`
- `GET /operational/shifts`
- `GET /operational/shifts/:id`
- `POST /operational/attendances/manual`
- `PATCH /operational/attendances/:id/complete`
- `PATCH /operational/attendances/:id/cancel`
- `GET /operational/plate-check/:plate?unitId=...`
- `POST /operational/plate-check/:plate/confirm-wash`
- `POST /operational/daily-washes/:id/cancel`
- `GET /operational/shifts/:shiftId/live-summary`
- `POST /operational/shifts/:shiftId/close`
- `GET /operational/closures`
- `GET /operational/closures/:id`

ANPR:

- `GET /anpr/cameras`
- `POST /anpr/cameras`
- `PUT /anpr/cameras/:id`
- `PATCH /anpr/cameras/:id/activate`
- `PATCH /anpr/cameras/:id/deactivate`
- `POST /anpr/events/simulate`
- `GET /anpr/events/:id`
- `GET /anpr/unit/:unitId/latest-events`
- `GET /anpr/unit/:unitId/summary`

Equipe das unidades:

- `GET /franchise-units`
- `GET /franchise-units/:unitId/staff`
- `POST /franchise-units/:unitId/staff`
- `PATCH /franchise-units/:unitId/staff/:id/activate`
- `PATCH /franchise-units/:unitId/staff/:id/deactivate`

Planos por porte:

- `GET /vehicle-size-categories`
- `POST /vehicle-size-categories`
- `PUT /vehicle-size-categories/:id`
- `PATCH /vehicle-size-categories/:id/activate`
- `PATCH /vehicle-size-categories/:id/deactivate`
- `GET /vehicle-model-size-rules`
- `POST /vehicle-model-size-rules`
- `PUT /vehicle-model-size-rules/:id`
- `PATCH /vehicle-model-size-rules/:id/activate`
- `PATCH /vehicle-model-size-rules/:id/deactivate`
- `GET /plans/:planId/vehicle-size-prices`
- `POST /plans/:planId/vehicle-size-prices`
- `PUT /plans/:planId/vehicle-size-prices/:id`
- `PATCH /plans/:planId/vehicle-size-prices/:id/activate`
- `PATCH /plans/:planId/vehicle-size-prices/:id/deactivate`

## Modulo 36 - CRUDs Super Admin

As rotas administrativas principais foram consolidadas como telas funcionais consumindo a API real do UAU+ Core:

- `/admin/settings`: lista e edita configuracoes globais via `GET /admin-settings` e `PUT /admin-settings`.
- `/admin/locations`: gerencia estados, cidades e unidades, com criacao, edicao, ativacao e desativacao.
- `/admin/plans`: gerencia planos, preco unico, abrangencia, dias/horarios, limite de veiculos, `useVehicleSizePricing` e precos por porte.
- `/admin/partners`: gerencia parceiros e percentuais de cashback/comissao.
- `/admin/campaigns`: gerencia campanhas, ativacao/desativacao e consulta metricas.
- `/admin/vehicle-sizes`: mantem a integracao do Modulo 36A para categorias de porte e regras por marca/modelo.

As telas usam componentes compartilhados para tabela, modal de formulario, dialogo de confirmacao, badges de status, campos de formulario, select, dinheiro e percentual. O acesso as rotas `/admin/*` permanece protegido para usuarios `SUPER_ADMIN`.

Para testar:

1. Inicie o backend UAU+ Core com os endpoints administrativos habilitados.
2. Configure `NEXT_PUBLIC_API_URL` no dashboard apontando para a API.
3. Rode `npm run dev` e entre com um usuario `SUPER_ADMIN`.
4. Acesse `/admin/settings`, `/admin/locations`, `/admin/plans`, `/admin/partners`, `/admin/campaigns` e `/admin/vehicle-sizes`.
5. Valide criar, editar, ativar/desativar e os estados de carregamento, erro e vazio.

## Modulo 36A - Planos por porte de veiculo

A rota `/admin/vehicle-sizes` permite ao Super Admin gerenciar categorias de porte e regras por marca/modelo.

A rota `/admin/plans` agora possui abas para:

- `Preco unico`: editar preco base e ativar/desativar `useVehicleSizePricing`.
- `Preco por porte`: listar, criar, editar e ativar/desativar precos por categoria em um plano.

## Modulo 37 - Financeiro, antifraude e relatorios

A rota `/admin/financial` foi transformada em um painel financeiro funcional com abas para:

- `Overview`: receita de assinaturas, comissao de parceiros, cashback, float, repasses estimados e fundo de marketing.
- `Float`: saldos disponiveis, promocionais, bloqueados e cashback em circulacao.
- `Ledger`: tabela paginada com filtros por periodo, unidade, usuario, parceiro, tipo e origem.
- `Regras de Franquia`: listagem, criacao e edicao de percentuais por unidade.
- `Relatorios`: listagem, geracao por unidade/periodo e fechamento de relatorios.

A rota `/admin/antifraud` foi transformada em um painel antifraude funcional com abas para:

- `Flags`: listagem com filtros por status, severidade e tipo, detalhe da flag e revisao como `REVIEWED`, `DISMISSED` ou `BLOCKED`.
- `Security Logs`: listagem com filtros por evento, usuario e periodo.
- `Acoes`: marcar usuario como suspeito, bloquear e desbloquear usuario com motivo obrigatorio e confirmacao antes do bloqueio.

As duas telas continuam protegidas para `SUPER_ADMIN`.

Para testar:

1. Inicie o backend UAU+ Core com os endpoints financeiros e antifraude.
2. Configure `NEXT_PUBLIC_API_URL` no dashboard.
3. Rode `npm run dev` e entre com um usuario `SUPER_ADMIN`.
4. Acesse `/admin/financial` e valide abas, filtros, criacao/edicao de regras, geracao e fechamento de relatorios.
5. Acesse `/admin/antifraud` e valide filtros de flags/logs, detalhe, revisao e acoes de usuario.

## Modulo 38 - Operacao completa

As rotas operacionais foram consolidadas para operador, franqueado e Super Admin:

- `/operator`: console de operacao com selecao de unidade, abertura de expediente, resumo ao vivo, registro manual de carro, conclusao/cancelamento de atendimento e fechamento.
- `/operator/plate-check`: validacao manual de placa com status grande, dados de cliente, veiculo, plano, assinatura, unidade, ultima lavagem, proxima liberacao e historico rapido quando retornado pela API.
- `/operator/shifts`: lista de expedientes com filtros por unidade, status e data, detalhe do shift, resumo ao vivo e fechamentos.
- `/operator/anpr`: resumo ANPR por unidade, ultimos eventos e simulacao de leitura de placa.
- `/admin/operations`: visao Super Admin com KPIs, shifts abertos, fechamentos recentes, divergencias e atalhos.
- `/franchise/operations`: visao do franqueado com KPIs das unidades, shifts abertos, atendimentos, divergencias, ANPR e fechamentos recentes.

Fluxo de abrir expediente:

1. Acesse `/operator`.
2. Selecione a unidade.
3. Preencha as leituras iniciais ativas.
4. Clique em `Abrir expediente`.

Fluxo de baixa manual:

1. Acesse `/operator/plate-check`.
2. Selecione a unidade e informe a placa.
3. Consulte o status.
4. Se retornar `AUTHORIZED`, clique em `Dar baixa na lavagem`.

Fluxo de ANPR:

1. Acesse `/operator/anpr`.
2. Selecione a unidade e, se necessario, a camera.
3. Veja o resumo e os ultimos eventos.
4. Simule uma leitura informando a placa.

Fluxo de fechamento:

1. Acesse `/operator` com expediente aberto.
2. Confira o resumo ao vivo.
3. Preencha as leituras finais.
4. Clique em `Fechar expediente` e confirme.

## Modulo 39 - Clientes, assinaturas, cobrancas e suporte

As telas de clientes foram criadas para Super Admin e franqueado:

- `/admin/customers`: lista clientes com filtros por nome, CPF, telefone, status, unidade e assinatura.
- `/admin/customers/[id]`: detalhe completo com abas de perfil, veiculos, assinatura/cobrancas, wallet/extrato, historico de lavagens, rede/MMN e suporte.
- `/franchise/customers`: lista clientes das unidades do franqueado com filtros simples.
- `/franchise/customers/[id]`: detalhe simplificado para visualizacao e suporte basico, sem bloqueio global.

Dados sensiveis como CPF e telefone sao exibidos mascarados nas tabelas. O Super Admin pode editar perfil, ativar, bloquear e marcar cliente como suspeito; o bloqueio exige confirmacao. Referrals/MMN usam endpoints opcionais e exibem estado vazio quando indisponiveis.

Fluxo de suporte Super Admin:

1. Acesse `/admin/customers`.
2. Filtre e abra o detalhe do cliente.
3. Use a aba `Suporte` para copiar o ID, marcar suspeito ou iniciar bloqueio.
4. Confirme o bloqueio no dialogo.

Fluxo de suporte franqueado:

1. Acesse `/franchise/customers`.
2. Abra o detalhe do cliente.
3. Consulte perfil, veiculos, cobrancas, wallet e historico.
4. Use a aba `Suporte` para copiar o ID e registrar internamente o atendimento.

## Modulo 34 - Validacao Manual de Placa

A rota `/operator/plate-check` permite consultar uma placa por unidade, ver cliente, veiculo, plano, assinatura, ultima lavagem e proxima liberacao. O botao de baixa aparece habilitado apenas quando a API retorna `AUTHORIZED`.

As rotas `/admin/units/staff` e `/franchise/staff` permitem selecionar uma unidade, vincular usuarios como `MANAGER` ou `OPERATOR` e ativar/desativar o vinculo.

## Validacoes

```bash
npm run typecheck
npm run build
```
