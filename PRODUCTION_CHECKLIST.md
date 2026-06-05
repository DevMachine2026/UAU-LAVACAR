# UAU+ Production Checklist

Data da auditoria: 2026-05-09

## Backend

- [x] Diretorio oficial do backend definido: `uau-core-backend` (na raiz do monorepo).
- [ ] Nao usar a pasta obsoleta `uau-clube-api` para deploy, build, migrations ou seed.
- [ ] Antes de executar comandos de backend, confirmar que o terminal esta em `uau-core-backend`.
- [ ] Configurar variaveis obrigatorias em ambiente seguro:
  - `NODE_ENV=production`
  - `PORT`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
  - `ALLOWED_ORIGINS`
  - `RATE_LIMIT_TTL`
  - `RATE_LIMIT_MAX`
  - `JSON_BODY_LIMIT`
  - `ENABLE_SWAGGER=false` em producao publica
  - `ASAAS_BASE_URL`
  - `ASAAS_API_KEY`
  - `ASAAS_WEBHOOK_TOKEN`
  - `ASAAS_ENVIRONMENT=production`
  - `SUPER_ADMIN_EMAIL`
  - `SUPER_ADMIN_PASSWORD`
  - `SUPER_ADMIN_NAME`
- [ ] Provisionar PostgreSQL gerenciado com backup automatico.
- [ ] Rodar `npm run prisma:generate`.
- [ ] Rodar migrations com processo controlado de producao. O script atual `npm run prisma:migrate` usa `prisma migrate dev`; para producao usar `npx prisma migrate deploy`.
- [ ] Rodar seed inicial apenas uma vez e validar idempotencia.
- [ ] Criar e testar Super Admin inicial.
- [ ] Configurar Asaas em sandbox antes de producao.
- [ ] Trocar para Asaas producao somente com webhooks conferidos.
- [ ] Configurar webhook Asaas com token/assinatura em segredo.
- [ ] Configurar `ALLOWED_ORIGINS` com dominios reais do web dashboard e mobile.
- [ ] Validar rate limit em login e webhooks.
- [ ] Desabilitar Swagger em producao publica ou proteger por rede/autenticacao.
- [ ] Expor health check no load balancer/plataforma.
- [ ] Centralizar logs de aplicacao e erros.
- [ ] Configurar rotacao/retenção de logs.
- [ ] Configurar backups e teste de restore do banco.
- [ ] Garantir que `.env` nao seja commitado.

## Mobile

- [ ] Configurar `EXPO_PUBLIC_API_URL` para a API de producao.
- [ ] Revisar `app.json`/Expo config para nome, slug, bundle identifiers e versao.
- [ ] Configurar EAS Build quando as credenciais de loja estiverem prontas.
- [ ] Gerar Android build de homologacao.
- [ ] Gerar iOS build de homologacao.
- [ ] Substituir placeholders de icone/splash por assets finais.
- [ ] Revisar permissoes futuras de push/camera antes de habilitar.
- [ ] Testar login.
- [ ] Testar cadastro.
- [ ] Testar assinatura.
- [ ] Testar wallet/cashback.
- [ ] Testar veiculos.
- [ ] Testar historico.
- [ ] Confirmar que dashboards administrativos nao aparecem no app mobile.

## Web Dashboard

- [ ] Configurar `NEXT_PUBLIC_API_URL` para a API de producao.
- [ ] Rodar `npm run typecheck`.
- [ ] Rodar `npm run build`.
- [ ] Configurar dominio/SSL.
- [ ] Configurar deploy com Node compativel com Next 15.
- [ ] Testar login por perfil:
  - [ ] `SUPER_ADMIN`
  - [ ] `FRANCHISE_OWNER`
  - [ ] `PARTNER`
  - [ ] `OPERATOR`
- [ ] Testar rotas protegidas e redirecionamento de usuarios sem permissao.
- [ ] Testar CRUDs Super Admin.
- [ ] Testar operacao, ANPR, baixa manual e fechamento.
- [ ] Testar financeiro, antifraude e relatorios.
- [ ] Confirmar que `.env.local` nao seja commitado.

## Comandos de validacao

### Backend

Executar a partir do backend oficial:

```bash
cd uau-core-backend
```

```bash
npm run prisma:generate
npx prisma validate
npm run build
npx tsc --noEmit
npm run openapi:export
npm run test:smoke
```

Para producao:

```bash
npx prisma migrate deploy
npm run seed
```

### Mobile

```bash
npm run typecheck
npx expo-doctor
```

### Web Dashboard

```bash
npm run typecheck
npm run build
```
