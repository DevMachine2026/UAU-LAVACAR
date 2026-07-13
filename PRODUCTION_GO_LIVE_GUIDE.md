# UAU+ Production Go-Live Guide

Este guia prepara o go-live controlado. Nao execute deploy automatico sem credenciais, janela aprovada e responsaveis online.

## FASE 1 - Pre-producao

- [ ] Staging validado ponta a ponta.
- [ ] Smoke test staging OK.
- [ ] Asaas sandbox OK.
- [ ] Webhook Asaas sandbox OK.
- [ ] Backup testado com restore.
- [ ] Usuarios admin revisados.
- [ ] Vulnerabilidades npm avaliadas e aceitas/corrigidas.
- [ ] Checklist de producao revisado.
- [ ] Plano de rollback revisado com a equipe.

## FASE 2 - Infra producao

- [ ] Banco PostgreSQL producao criado.
- [ ] Usuario de banco com privilegios minimos criado.
- [ ] Dominio da API configurado.
- [ ] Dominio do dashboard configurado.
- [ ] SSL ativo para API e dashboard.
- [ ] Envs de producao configuradas em secret manager/plataforma.
- [ ] CORS de producao sem wildcard.
- [ ] Storage/logs configurados.
- [ ] Backups automaticos habilitados.
- [ ] Retencao de logs definida.

## FASE 3 - Deploy backend

Diretorio oficial:

```bash
cd uau-core-backend
```

Passos:

```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
npm run start:prod
```

Validacoes:

- [ ] `GET /api/v1/health`
- [ ] `GET /api/v1/health/ready`
- [ ] OpenAPI export opcional:

```bash
npm run openapi:export
```

## FASE 4 - Deploy dashboard

Diretorio:

```bash
cd uau-web-dashboard
```

Configurar:

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

Build:

```bash
npm ci
npm run typecheck
npm run build
```

Validacoes:

- [ ] Abrir dashboard em dominio de producao.
- [ ] Login Super Admin.
- [ ] Rotas protegidas por perfil.
- [ ] Overview principal.

## FASE 5 - Asaas producao

- [ ] Configurar `ASAAS_API_KEY` de producao.
- [ ] Configurar `ASAAS_BASE_URL=https://api.asaas.com`.
- [ ] Configurar webhook de producao.
- [ ] Validar `ASAAS_WEBHOOK_TOKEN`.
- [ ] Testar cobranca PIX real de baixo valor.
- [ ] Verificar retorno webhook.
- [ ] Confirmar billing history e status de assinatura.

## FASE 6 - Mobile

Diretorio:

```bash
cd uau-mobile-app
```

Configurar:

```env
EXPO_PUBLIC_API_URL=https://api.seudominio.com/api/v1
```

Validar:

```bash
npm ci
npm run typecheck
npx expo-doctor
```

Builds futuros:

```bash
npx eas build --platform android
npx eas build --platform ios
```

Testar em dispositivo antes de publicacao controlada.

## FASE 7 - Go-live controlado

- [ ] Liberar apenas usuarios internos inicialmente.
- [ ] Testar 1 unidade.
- [ ] Testar 1 plano.
- [ ] Testar 1 cobranca.
- [ ] Testar baixa manual.
- [ ] Testar ANPR simulado.
- [ ] Testar parceiro.
- [ ] Testar dashboard financeiro.
- [ ] Validar wallet/cashback.
- [ ] Validar historico de lavagens.

## FASE 8 - Monitoramento

Monitorar continuamente:

- logs da API;
- erros HTTP;
- webhooks Asaas;
- cobrancas;
- wallet;
- cashback;
- MMN;
- financeiro;
- ledger;
- fechamento de expedientes;
- ANPR;
- alertas de seguranca.

## Criterios de parada

Pausar o go-live se ocorrer:

- erro em cobranca real;
- webhook Asaas duplicado/perdido;
- divergencia financeira;
- falha de login generalizada;
- erro de baixa de lavagem;
- erro de CORS em producao;
- picos de 5xx.

Nesses casos, seguir `ROLLBACK_PLAN.md`.
