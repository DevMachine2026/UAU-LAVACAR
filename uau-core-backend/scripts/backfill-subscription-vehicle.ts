/**
 * Backfill: associa vehicleId nas Subscriptions migradas do sistema legado.
 *
 * Regras de associação (aplicadas nesta ordem, para na primeira que resolver):
 *   1. Cliente com exatamente 1 veículo → associa automaticamente.
 *   2. Cliente com >1 veículo e algum com isPrimary = true → associa o primário.
 *   3. Cliente com >1 veículo sem nenhum primário → lista como "ambíguo" (decisão manual).
 *   4. Cliente sem nenhum veículo cadastrado → lista como "sem veículo" (pula, não falha).
 *
 * Uso (DRY RUN — apenas lê, não escreve):
 *   DRY_RUN=true npx ts-node -r tsconfig-paths/register scripts/backfill-subscription-vehicle.ts
 *
 * Uso (escrita real — só após revisar o dry run):
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-subscription-vehicle.ts
 */

import { PrismaClient } from '@prisma/client';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const prisma = new PrismaClient();

function log(icon: string, msg: string) {
  console.log(`  ${icon} ${msg}`);
}

async function main() {
  console.log(
    DRY_RUN
      ? '⚠️  DRY_RUN=true — nada será gravado no banco\n'
      : '🚀  Modo de ESCRITA ativo — alterações serão persistidas\n',
  );

  // ── 1. Carregar todas as Subscriptions com vehicleId NULL ──────────────────

  const subs = await prisma.subscription.findMany({
    where: { vehicleId: null },
    select: { id: true, customerId: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`─── Subscriptions com vehicleId NULL: ${subs.length} ───\n`);

  if (subs.length === 0) {
    console.log('✅  Nenhuma subscription pendente. Nada a fazer.');
    return;
  }

  // ── 2. Agrupar por customerId para evitar N queries por sub ───────────────

  const customerIds = [...new Set(subs.map((s) => s.customerId))];

  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: { in: customerIds }, isActive: true },
    select: { id: true, customerId: true, plate: true, brand: true, model: true, isPrimary: true },
  });

  // Map customerId → vehicles[]
  const vehiclesByCustomer = new Map<string, typeof vehicles>();
  for (const v of vehicles) {
    const list = vehiclesByCustomer.get(v.customerId) ?? [];
    list.push(v);
    vehiclesByCustomer.set(v.customerId, list);
  }

  // ── 3. Processar cada subscription ────────────────────────────────────────

  type AmbiguousEntry = { subscriptionId: string; customerId: string; plates: string[] };
  type NoVehicleEntry  = { subscriptionId: string; customerId: string };

  const toUpdate: { subscriptionId: string; vehicleId: string; plate: string }[] = [];
  const ambiguous: AmbiguousEntry[] = [];
  const noVehicle: NoVehicleEntry[]  = [];

  for (const sub of subs) {
    const cvs = vehiclesByCustomer.get(sub.customerId) ?? [];

    if (cvs.length === 0) {
      noVehicle.push({ subscriptionId: sub.id, customerId: sub.customerId });
      continue;
    }

    if (cvs.length === 1) {
      toUpdate.push({ subscriptionId: sub.id, vehicleId: cvs[0].id, plate: cvs[0].plate });
      continue;
    }

    // Múltiplos veículos: usa o primário se existir
    const primary = cvs.find((v) => v.isPrimary);
    if (primary) {
      toUpdate.push({ subscriptionId: sub.id, vehicleId: primary.id, plate: primary.plate });
    } else {
      ambiguous.push({
        subscriptionId: sub.id,
        customerId: sub.customerId,
        plates: cvs.map((v) => v.plate),
      });
    }
  }

  // ── 4. Relatório ──────────────────────────────────────────────────────────

  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│                    RESULTADO                    │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│  Resolvidas automaticamente : ${String(toUpdate.length).padStart(5)}             │`);
  console.log(`│  Ambíguas (decisão manual)  : ${String(ambiguous.length).padStart(5)}             │`);
  console.log(`│  Sem veículo cadastrado     : ${String(noVehicle.length).padStart(5)}             │`);
  console.log(`│  Total processadas          : ${String(subs.length).padStart(5)}             │`);
  console.log('└─────────────────────────────────────────────────┘\n');

  if (ambiguous.length > 0) {
    console.log('── Subscriptions AMBÍGUAS (múltiplos veículos sem primário) ──');
    for (const entry of ambiguous) {
      log('⚠️ ', `sub ${entry.subscriptionId} | customer ${entry.customerId} | placas: [${entry.plates.join(', ')}]`);
    }
    console.log();
  }

  if (noVehicle.length > 0) {
    console.log('── Subscriptions SEM VEÍCULO ──');
    for (const entry of noVehicle) {
      log('🚫', `sub ${entry.subscriptionId} | customer ${entry.customerId}`);
    }
    console.log();
  }

  if (toUpdate.length > 0) {
    console.log(`── ${DRY_RUN ? '[DRY RUN] Seriam atualizadas' : 'Atualizando'}: ${toUpdate.length} subscriptions ──`);
  }

  // ── 5. Escrever (só se não for DRY RUN) ──────────────────────────────────

  if (DRY_RUN) {
    console.log('\n⚠️  DRY_RUN=true — nenhuma alteração foi gravada.');
    console.log('   Para aplicar, rode novamente sem a variável DRY_RUN (ou com DRY_RUN=false).');
    return;
  }

  let updated = 0;
  let errors  = 0;

  for (const entry of toUpdate) {
    try {
      await prisma.subscription.update({
        where: { id: entry.subscriptionId },
        data: { vehicleId: entry.vehicleId },
      });
      log('✓', `sub ${entry.subscriptionId} → placa ${entry.plate} (vehicleId ${entry.vehicleId})`);
      updated++;
    } catch (err) {
      log('✗', `sub ${entry.subscriptionId} — ERRO: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`\n✅  Concluído: ${updated} atualizadas, ${errors} erros, ${ambiguous.length} ambíguas (pendentes), ${noVehicle.length} sem veículo.`);
}

main()
  .catch((err) => {
    console.error('❌  Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
