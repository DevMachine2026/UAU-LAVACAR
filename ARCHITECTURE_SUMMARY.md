# UAU+ Architecture Summary

## Backend

O backend principal esta em `uau-core-backend` (na raiz do monorepo). Ele usa NestJS, Prisma e PostgreSQL, com prefixo global `api/v1`, validação global de DTOs, CORS configuravel, Helmet, rate limit simples para login/webhooks e OpenAPI/Swagger. A pasta `uau-clube-api` esta obsoleta e vazia.

Modulos cobertos pelos ciclos recentes:

- Autenticacao e perfis.
- Admin settings.
- Estados, cidades e unidades.
- Planos e precos por porte de veiculo.
- Parceiros.
- Campanhas.
- Clientes, veiculos, assinaturas, wallet e cobrancas.
- Cashback, ledger, float e regras financeiras.
- Operacao, expedientes, atendimentos, baixa manual e lavagens diarias.
- ANPR/cameras/eventos.
- Antifraude, flags e security logs.
- Staff de unidades.
- Auditoria/AuditLog.

## Mobile App

O app em `uau-mobile-app` e focado no assinante/cliente. Os dashboards administrativos, franqueado, parceiro e operacional ficam no `uau-web-dashboard`.

Fluxos principais:

- Login/cadastro.
- Home do assinante.
- Wallet/cashback.
- Minhas cobrancas.
- Assinar.
- Parceiros.
- Minha rede/MMN.
- Meus veiculos.
- Historico.
- Notificacoes.
- Perfil.

## Web Dashboard

O dashboard em `uau-web-dashboard` concentra os portais:

- Super Admin.
- Franqueado.
- Parceiro.
- Operador.

Areas principais:

- CRUDs Super Admin: settings, locais, planos, parceiros, campanhas e portes.
- Financeiro: overview, float, ledger, regras e relatorios.
- Antifraude: flags, logs e acoes de usuario.
- Operacao: shifts, placa manual, ANPR e fechamentos.
- Clientes: consultas, detalhes, wallet, cobrancas, lavagens e suporte.
- Staff de unidades.

## Fluxo de assinatura

1. Cliente escolhe um plano.
2. Backend resolve preco do plano.
3. Se `useVehicleSizePricing=false`, usa preco base.
4. Se `useVehicleSizePricing=true`, resolve porte do veiculo por regra marca/modelo e busca preco ativo do plano para o porte.
5. Preview e confirmacao usam o preco resolvido.
6. Integracao Asaas gera cobranca.
7. Billing history e assinatura refletem status do pagamento.

## Fluxo de cashback

1. Transacoes elegiveis geram cashback conforme regras.
2. Cashback entra na wallet.
3. Wallet separa saldos disponivel, promocional e bloqueado quando aplicavel.
4. Uso de cashback em cobrancas abate o valor do cliente.
5. Ledger registra movimentos e permite auditoria financeira.

## Fluxo MMN/rede

1. Usuario pode ter indicador/rede.
2. Endpoints de referrals expõem resumo e arvore quando disponiveis.
3. Mobile mostra rede do assinante.
4. Web admin usa referrals no detalhe de cliente para suporte/auditoria.

## Fluxo parceiros

1. Parceiro e cadastrado com percentuais de cashback/comissao.
2. Cliente transaciona com parceiro.
3. Sistema calcula cashback gerado, cashback ao cliente, comissao UAU e limite de cashback aceito.
4. Financeiro consolida receitas e ledger.

## Fluxo operacao/ANPR

1. Operador seleciona unidade.
2. Abre expediente com leituras iniciais.
3. Atendimentos entram por baixa manual ou ANPR.
4. Validacao de placa consulta plano, assinatura, abrangencia, janela permitida e uso diario.
5. Uma lavagem confirmada por veiculo/dia bloqueia nova baixa ate a proxima liberacao.
6. ANPR registra eventos e classifica status visual.
7. Operador fecha expediente com leituras finais.
8. Super Admin e franqueado acompanham KPIs, closures e divergencias.

## Fluxo financeiro/float

1. Assinaturas e parceiros geram receitas.
2. Cashback emitido/usado/expirado afeta float.
3. Ledger registra movimentos.
4. Regras por franquia calculam repasse, royalty UAU e fundo de marketing.
5. Relatorios por unidade/periodo consolidam valores e podem ser fechados.
