/**
 * Limpeza de BillingHistory PENDING vencidos — migração do sistema legado.
 *
 * Sempre executa dry run antes de qualquer escrita e exige confirmação interativa.
 * Usa DIRECT_URL (conexão direta, sem PgBouncer) para operação em lote segura.
 * Salva log em scripts/logs/clean-legacy-pending-YYYY-MM-DD-HH-mm.log
 *
 * Uso (DEV — lê DIRECT_URL do .env local):
 *   npx tsx scripts/clean-legacy-pending.ts
 *
 * Uso (PRODUÇÃO — exporte DIRECT_URL apontando para o banco de produção):
 *   DIRECT_URL="postgresql://user:pass@host/db?sslmode=require" npx tsx scripts/clean-legacy-pending.ts
 *
 * ATENÇÃO: esse script modifica dados em produção sem reversão automática.
 *          Revise o dry run e a amostra antes de digitar "CONFIRMAR".
 */

import { PrismaClient, BillingStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { createInterface } from 'readline/promises';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// ─── Carrega .env apenas se DIRECT_URL não estiver no ambiente ────────────────

if (!process.env.DIRECT_URL) {
  const envPath = resolve(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(['"]?)(.*?)\2\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[3];
      }
    }
  }
}

// ─── Valida DIRECT_URL ────────────────────────────────────────────────────────

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error('❌  DIRECT_URL não definida.');
  console.error('    Em DEV  : configure em uau-core-backend/.env');
  console.error('    Em PROD : exporte DIRECT_URL="postgresql://..." antes de rodar');
  process.exit(1);
}

// ─── Prisma com conexão direta (sem PgBouncer — necessário para updateMany) ──

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

// ─── Logger com captura para arquivo de log ───────────────────────────────────

const logLines: string[] = [];

function out(msg = '') {
  console.log(msg);
  logLines.push(msg);
}

function saveLog(runAt: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = [
    runAt.getUTCFullYear(),
    pad(runAt.getUTCMonth() + 1),
    pad(runAt.getUTCDate()),
    pad(runAt.getUTCHours()),
    pad(runAt.getUTCMinutes()),
  ].join('-');

  const logsDir = resolve(__dirname, 'logs');
  mkdirSync(logsDir, { recursive: true });
  const logPath = resolve(logsDir, `clean-legacy-pending-${ts}.log`);
  writeFileSync(logPath, logLines.join('\n') + '\n', 'utf-8');
  console.log(`\n📄  Log salvo em: ${logPath}`);
}

// ─── Helpers de formatação ────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : 'N/A';
}

function fmtBRL(d: Prisma.Decimal | null | undefined): string {
  return `R$ ${Number(d ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const runAt = new Date();
  const host = directUrl!.match(/@([^/?]+)/)?.[1] ?? '(host mascarado)';

  out('═══════════════════════════════════════════════════════════════════');
  out('   LIMPEZA DE BILLING_HISTORY PENDING VENCIDOS — SISTEMA LEGADO   ');
  out('═══════════════════════════════════════════════════════════════════');
  out(`   Iniciado em : ${runAt.toISOString()}`);
  out(`   Banco       : ${host}`);
  out('');

  // ── PASSO 1/4: DRY RUN ───────────────────────────────────────────────────

  out('── PASSO 1/4 — DRY RUN ──────────────────────────────────────────');
  out('   Consultando registros PENDING com dueDate < agora...');
  out('');

  const where = {
    status: BillingStatus.PENDING,
    dueDate: { lt: runAt },
  } satisfies Prisma.BillingHistoryWhereInput;

  const agg = await prisma.billingHistory.aggregate({
    where,
    _count: { id: true },
    _min: { dueDate: true },
    _max: { dueDate: true },
    _sum: { amount: true },
  });

  const total = agg._count.id;

  out('┌───────────────────────────────────────────────────────────────┐');
  out('│                       RESUMO DO DRY RUN                      │');
  out('├───────────────────────────────────────────────────────────────┤');
  out(`│  Registros a cancelar  : ${String(total).padStart(7)}                        │`);
  out(`│  dueDate mais antiga   : ${fmtDate(agg._min.dueDate).padEnd(37)}│`);
  out(`│  dueDate mais recente  : ${fmtDate(agg._max.dueDate).padEnd(37)}│`);
  out(`│  Valor total somado    : ${fmtBRL(agg._sum.amount).padEnd(37)}│`);
  out('└───────────────────────────────────────────────────────────────┘');
  out('');

  if (total === 0) {
    out('✅  Nenhum registro PENDING vencido encontrado. Nada a fazer.');
    saveLog(runAt);
    return;
  }

  // ── PASSO 2/4: AMOSTRA ───────────────────────────────────────────────────

  out('── PASSO 2/4 — AMOSTRA (5 registros mais antigos) ──────────────');
  out('');

  const sample = await prisma.billingHistory.findMany({
    where,
    select: { id: true, customerId: true, amount: true, dueDate: true },
    orderBy: { dueDate: 'asc' },
    take: 5,
  });

  out('  id                            customerId         amount        dueDate');
  out('  ────────────────────────────────────────────────────────────────────');
  for (const r of sample) {
    const id = r.id.slice(0, 27).padEnd(27);
    const cid = r.customerId.slice(0, 16).padEnd(16);
    const amt = `R$ ${Number(r.amount).toFixed(2)}`.padStart(12);
    out(`  ${id}  ${cid}  ${amt}  ${fmtDate(r.dueDate)}`);
  }
  out('');

  // ── PASSO 3/4: CONFIRMAÇÃO INTERATIVA ────────────────────────────────────

  out('── PASSO 3/4 — CONFIRMAÇÃO ──────────────────────────────────────');
  out('');
  out(`  ❓  Confirmar limpeza de ${total} registros PENDING vencidos?`);
  out(`      Ação: status → CANCELLED (sem reversão automática)`);
  out('');
  out('  Digite "CONFIRMAR" para prosseguir ou qualquer outra coisa para cancelar:');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('  > ');
  rl.close();

  out(`  Resposta digitada: "${answer}"`);
  out('');

  if (answer !== 'CONFIRMAR') {
    out('⛔  Operação cancelada. Nenhum registro foi modificado.');
    saveLog(runAt);
    return;
  }

  // ── PASSO 4/4: UPDATE ────────────────────────────────────────────────────

  out('── PASSO 4/4 — APLICANDO UPDATE ─────────────────────────────────');
  out('');

  const updateStartedAt = new Date();
  out(`  🚀  Início: ${updateStartedAt.toISOString()}`);

  // Usa o mesmo `runAt` do dry run como cutoff — garante consistência com o que o usuário aprovou.
  const result = await prisma.billingHistory.updateMany({
    where,
    data: {
      status: BillingStatus.CANCELLED,
      description: 'Migrado do sistema legado — inadimplência histórica não cobrada',
    },
  });

  const updateFinishedAt = new Date();
  const elapsedMs = updateFinishedAt.getTime() - updateStartedAt.getTime();

  out(`  ✅  Fim   : ${updateFinishedAt.toISOString()} (${elapsedMs}ms)`);
  out(`  Registros atualizados: ${result.count}`);
  out('');

  // ── VALIDAÇÃO PÓS-UPDATE ─────────────────────────────────────────────────

  out('── VALIDAÇÃO PÓS-UPDATE ──────────────────────────────────────────');
  out('');

  const [pendingCount, cancelledCount, paidCount] = await Promise.all([
    prisma.billingHistory.count({ where: { status: BillingStatus.PENDING } }),
    prisma.billingHistory.count({ where: { status: BillingStatus.CANCELLED } }),
    prisma.billingHistory.count({ where: { status: BillingStatus.PAID } }),
  ]);

  out('┌───────────────────────────────────────────────────────────────┐');
  out('│                    VALIDAÇÃO PÓS-UPDATE                      │');
  out('├───────────────────────────────────────────────────────────────┤');
  out(`│  PENDING   (esperado: ~0)          : ${String(pendingCount).padStart(6)}                  │`);
  out(`│  CANCELLED (aumentou em +${String(result.count).padEnd(7)})  : ${String(cancelledCount).padStart(6)}                  │`);
  out(`│  PAID      (deve permanecer igual) : ${String(paidCount).padStart(6)}                  │`);
  out('└───────────────────────────────────────────────────────────────┘');
  out('');

  if (pendingCount === 0) {
    out('✅  Zero PENDING vencidos restantes — limpeza concluída com sucesso.');
  } else {
    out(`⚠️   Ainda há ${pendingCount} PENDING restante(s).`);
    out('     Podem ser cobranças recentes criadas durante a janela de execução do script.');
    out("     Verifique: SELECT id, \"dueDate\", status FROM billing_history WHERE status = 'PENDING';");
  }

  saveLog(runAt);
}

main()
  .catch((err) => {
    console.error('\n❌  Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
