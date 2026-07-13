# UAU+ Post-Deploy Smoke Test

Executar depois de deploy em producao, com usuarios e valores controlados.

## Preparacao

- Confirmar URL da API:

```text
https://api.seudominio.com/api/v1
```

- Confirmar URL do dashboard:

```text
https://dashboard.seudominio.com
```

- Ter credenciais Super Admin.
- Ter cliente de teste autorizado.
- Ter plano/unidade de teste.
- Ter chave Asaas producao configurada.

## Testes API

1. Health:

```http
GET /health
```

Esperado: `status=ok`.

2. Ready:

```http
GET /health/ready
```

Esperado: `status=ready` (HTTP 503 com `status=not_ready` se o banco estiver fora).

3. Login Super Admin:

```http
POST /auth/login
```

Esperado: token JWT e role `SUPER_ADMIN`.

4. Login cliente:

```http
POST /auth/login
```

Esperado: token JWT e role de cliente/assinante.

5. Dashboard overview:

```http
GET /admin-dashboard/overview
```

Esperado: resposta 200 com metricas.

6. Financial overview:

```http
GET /financial/overview
```

Esperado: resposta 200 com metricas financeiras.

## Testes de cliente e assinatura

1. Criar cliente teste ou validar cliente teste existente.
2. Criar veiculo para o cliente.
3. Rodar preview de assinatura.
4. Confirmar checkout PIX.
5. Conferir cobranca no Asaas.
6. Simular/aguardar webhook Asaas.
7. Conferir `Minhas cobrancas`.
8. Conferir status da assinatura.

## Testes operacionais

1. Validar placa do cliente em `/operator/plate-check`.
2. Confirmar baixa manual se autorizado.
3. Consultar novamente e confirmar bloqueio por uso diario.
4. Testar ANPR simulado.
5. Abrir e fechar expediente de teste se a unidade estiver preparada.

## Testes parceiro

1. Rodar preview de transacao parceiro.
2. Confirmar transacao parceiro.
3. Conferir cashback gerado.
4. Conferir ledger/financeiro.

## Testes dashboard

1. Login Super Admin.
2. Login franqueado.
3. Login operador.
4. Abrir `/admin/financial`.
5. Abrir `/admin/operations`.
6. Abrir `/admin/customers`.
7. Abrir `/operator/plate-check`.

## Criterio de sucesso

Todos os testes criticos devem retornar 200/201/estado esperado. Qualquer erro em cobranca, webhook, wallet, ledger ou baixa operacional deve pausar o go-live controlado e acionar `ROLLBACK_PLAN.md`.
