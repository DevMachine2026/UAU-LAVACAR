# UAU+ Rollback Plan

Este plano descreve como voltar atras em caso de falha no go-live.

## 1. Voltar deploy anterior

- Identificar a versao anterior estavel do backend.
- Fazer rollback pela plataforma de deploy.
- Confirmar que a API antiga responde:

```text
GET /api/v1/health
GET /api/v1/health/ready
```

- Reapontar trafego no load balancer quando aplicavel.
- Validar login Super Admin e cliente.

## 2. Pausar webhooks Asaas

- Acessar painel Asaas.
- Desabilitar temporariamente webhook de producao.
- Registrar horario de pausa.
- Preservar logs/eventos para reprocessamento manual.
- Reativar apenas depois que a API estiver saudavel.

## 3. Bloquear novos checkouts

Opcoes operacionais:

- desabilitar planos no dashboard;
- remover CTA de assinatura temporariamente;
- bloquear fluxo de checkout por feature flag/env se disponivel;
- comunicar equipe de suporte para nao orientar novas assinaturas durante incidente.

Nao apagar assinaturas/cobrancas existentes.

## 4. Manter app legado ativo

- Nao despublicar builds mobile anteriores durante go-live.
- Manter dominio/API anterior disponivel ate estabilizacao.
- Se necessario, orientar usuarios internos a usar versao anterior.

## 5. Restaurar backup

Usar somente em incidente de dados confirmado.

Passos:

1. Pausar aplicacao ou colocar em manutencao.
2. Pausar webhooks Asaas.
3. Capturar snapshot do estado atual para analise.
4. Restaurar backup validado do PostgreSQL.
5. Rodar verificacoes de integridade.
6. Reativar API.
7. Reprocessar webhooks/eventos pendentes com cuidado.

## 6. Comunicar equipe

Mensagem minima:

- status do incidente;
- impacto conhecido;
- acao tomada;
- proximo update previsto;
- responsavel tecnico;
- orientacao para suporte/comercial.

## 7. Criterios para encerrar rollback

- API saudavel.
- Login Super Admin e cliente OK.
- Webhooks recebidos sem erro.
- Cobrancas conferidas.
- Ledger/financeiro sem divergencia critica.
- Operacao/baixa manual funcionando.
- Equipe avisada.
