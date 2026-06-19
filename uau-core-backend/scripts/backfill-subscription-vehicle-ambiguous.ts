/**
 * Segunda etapa do backfill de vehicleId: resolve as Subscriptions ambíguas
 * (customers com múltiplos veículos e nenhum isPrimary marcado).
 *
 * Passo A — Isolamento de dado sujo:
 *   Para cada grupo de veículos de um customer, verifica se algum par de placas
 *   tem Levenshtein ≤ 2 OU uma é substring da outra. Esses casos são listados
 *   para decisão manual — NÃO são atualizados automaticamente.
 *
 * Passo B — Regra de mais recente:
 *   Para os demais (veículos genuinamente diferentes), identifica qual veículo
 *   tem o DailyWash mais recente (proxy de "em uso"). Se nenhum veículo tiver
 *   DailyWash, usa o veículo com maior createdAt (mais recentemente cadastrado).
 *   Aplica esse vehicleId a TODAS as Subscriptions NULL do customer.
 *
 * Uso (DRY RUN — padrão, não escreve):
 *   DRY_RUN=true npx ts-node -r tsconfig-paths/register scripts/backfill-subscription-vehicle-ambiguous.ts
 *
 * Uso (escrita real):
 *   DRY_RUN=false npx ts-node -r tsconfig-paths/register scripts/backfill-subscription-vehicle-ambiguous.ts
 */

import { PrismaClient } from '@prisma/client';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const prisma = new PrismaClient();

// ─── Levenshtein ─────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isDirtyPair(p1: string, p2: string): boolean {
  const a = p1.toUpperCase();
  const b = p2.toUpperCase();
  if (a.includes(b) || b.includes(a)) return true;
  return levenshtein(a, b) <= 2;
}

function hasDirtyPlates(plates: string[]): boolean {
  for (let i = 0; i < plates.length; i++) {
    for (let j = i + 1; j < plates.length; j++) {
      if (isDirtyPair(plates[i], plates[j])) return true;
    }
  }
  return false;
}

function getDirtyPairs(plates: string[]): [string, string, number][] {
  const pairs: [string, string, number][] = [];
  for (let i = 0; i < plates.length; i++) {
    for (let j = i + 1; j < plates.length; j++) {
      if (isDirtyPair(plates[i], plates[j])) {
        pairs.push([plates[i], plates[j], levenshtein(plates[i].toUpperCase(), plates[j].toUpperCase())]);
      }
    }
  }
  return pairs;
}

function log(icon: string, msg: string) {
  console.log(`  ${icon} ${msg}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    DRY_RUN
      ? '⚠️  DRY_RUN=true — nada será gravado\n'
      : '🚀  Modo de ESCRITA ativo\n',
  );

  // ── 1. Recarregar subscriptions ainda NULL (as 391 já foram resolvidas) ───

  const remainingSubs = await prisma.subscription.findMany({
    where: { vehicleId: null },
    select: { id: true, customerId: true, status: true, createdAt: true, startedAt: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`─── Subscriptions ainda com vehicleId NULL: ${remainingSubs.length} ───\n`);

  if (remainingSubs.length === 0) {
    console.log('✅  Nenhuma subscription pendente. Backfill completo.');
    return;
  }

  // ── 2. Agrupar por customerId ──────────────────────────────────────────────

  const customerIds = [...new Set(remainingSubs.map((s) => s.customerId))];

  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: { in: customerIds }, isActive: true },
    select: { id: true, customerId: true, plate: true, brand: true, model: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const vehiclesByCustomer = new Map<string, typeof vehicles>();
  for (const v of vehicles) {
    const list = vehiclesByCustomer.get(v.customerId) ?? [];
    list.push(v);
    vehiclesByCustomer.set(v.customerId, list);
  }

  const subsByCustomer = new Map<string, typeof remainingSubs>();
  for (const s of remainingSubs) {
    const list = subsByCustomer.get(s.customerId) ?? [];
    list.push(s);
    subsByCustomer.set(s.customerId, list);
  }

  // ── 3. Buscar DailyWash mais recente por vehicleId (todos os veículos dos customers) ──

  const allVehicleIds = vehicles.map((v) => v.id);
  const latestWashes = await prisma.dailyWash.findMany({
    where: { vehicleId: { in: allVehicleIds }, used: true },
    select: { vehicleId: true, usedAt: true, date: true },
    orderBy: { date: 'desc' },
  });

  // Mantém apenas o mais recente por veículo
  const lastWashByVehicle = new Map<string, Date>();
  for (const w of latestWashes) {
    if (!lastWashByVehicle.has(w.vehicleId)) {
      lastWashByVehicle.set(w.vehicleId, w.usedAt ?? w.date);
    }
  }

  // ── 4. Classificar customers em Passo A ou Passo B ────────────────────────

  type PassoAEntry = {
    customerId: string;
    plates: string[];
    dirtyPairs: [string, string, number][];
    subscriptionCount: number;
  };
  type PassoBEntry = {
    customerId: string;
    chosenVehicleId: string;
    chosenPlate: string;
    reason: string;
    plates: string[];
    subscriptionIds: string[];
  };

  const passoA: PassoAEntry[] = [];
  const passoB: PassoBEntry[] = [];

  for (const customerId of customerIds) {
    const cvs = vehiclesByCustomer.get(customerId) ?? [];
    const subs = subsByCustomer.get(customerId) ?? [];

    if (cvs.length === 0) continue; // já tratado no script anterior como "sem veículo"

    const plates = cvs.map((v) => v.plate);

    if (hasDirtyPlates(plates)) {
      passoA.push({
        customerId,
        plates,
        dirtyPairs: getDirtyPairs(plates),
        subscriptionCount: subs.length,
      });
      continue;
    }

    // Passo B: veículos genuinamente diferentes — escolhe o mais recentemente usado
    // Critério 1: DailyWash mais recente
    let chosen = cvs
      .filter((v) => lastWashByVehicle.has(v.id))
      .sort((a, b) => {
        const da = lastWashByVehicle.get(a.id)!.getTime();
        const db = lastWashByVehicle.get(b.id)!.getTime();
        return db - da;
      })[0];

    let reason: string;
    if (chosen) {
      reason = `DailyWash mais recente em ${lastWashByVehicle.get(chosen.id)!.toISOString().slice(0, 10)}`;
    } else {
      // Critério 2: veículo criado mais recentemente
      chosen = cvs[0]; // já vem ordenado por createdAt desc
      reason = `Sem DailyWash — veículo mais recentemente cadastrado (${chosen.createdAt.toISOString().slice(0, 10)})`;
    }

    passoB.push({
      customerId,
      chosenVehicleId: chosen.id,
      chosenPlate: chosen.plate,
      reason,
      plates,
      subscriptionIds: subs.map((s) => s.id),
    });
  }

  // ── 5. Relatório ──────────────────────────────────────────────────────────

  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│           ANÁLISE DOS CASOS AMBÍGUOS            │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│  Passo A — dado sujo (decisão manual) : ${String(passoA.length).padStart(4)}    │`);
  console.log(`│  Passo B — regra de mais recente      : ${String(passoB.length).padStart(4)}    │`);
  console.log(`│  Total customers ambíguos             : ${String(customerIds.length).padStart(4)}    │`);
  console.log('└─────────────────────────────────────────────────┘\n');

  // ── Passo A ───────────────────────────────────────────────────────────────

  if (passoA.length > 0) {
    console.log('══ PASSO A — Dado sujo (NÃO serão alterados automaticamente) ══');
    for (const entry of passoA) {
      log('🔴', `customer ${entry.customerId} | ${entry.subscriptionCount} subscription(s)`);
      log('  ', `  placas: [${entry.plates.join(', ')}]`);
      for (const [p1, p2, dist] of entry.dirtyPairs) {
        log('  ', `  par suspeito: "${p1}" ↔ "${p2}" (Levenshtein=${dist})`);
      }
    }
    console.log();
  }

  // ── Passo B ───────────────────────────────────────────────────────────────

  if (passoB.length > 0) {
    console.log(`══ PASSO B — ${DRY_RUN ? '[DRY RUN] Seriam atualizadas' : 'Atualizando'}: ${passoB.length} customers ══`);
    for (const entry of passoB) {
      log('✓', `customer ${entry.customerId}`);
      log('  ', `  veículos disponíveis: [${entry.plates.join(', ')}]`);
      log('  ', `  escolhido: ${entry.chosenPlate} (vehicleId ${entry.chosenVehicleId})`);
      log('  ', `  motivo: ${entry.reason}`);
      log('  ', `  atualiza ${entry.subscriptionIds.length} subscription(s): [${entry.subscriptionIds.join(', ')}]`);
    }
    console.log();
  }

  // ── 6. Escrita (só se não for DRY RUN e só Passo B) ──────────────────────

  if (DRY_RUN) {
    const totalSubsPassoB = passoB.reduce((acc, e) => acc + e.subscriptionIds.length, 0);
    console.log(`⚠️  DRY_RUN=true — ${totalSubsPassoB} subscription(s) do Passo B seriam atualizadas.`);
    console.log('   Passo A requer decisão manual antes de qualquer escrita.');
    console.log('   Para aplicar o Passo B, rode com DRY_RUN=false.');
    return;
  }

  let updated = 0;
  let errors  = 0;

  for (const entry of passoB) {
    for (const subId of entry.subscriptionIds) {
      try {
        await prisma.subscription.update({
          where: { id: subId },
          data: { vehicleId: entry.chosenVehicleId },
        });
        log('✓', `sub ${subId} → placa ${entry.chosenPlate}`);
        updated++;
      } catch (err) {
        log('✗', `sub ${subId} — ERRO: ${(err as Error).message}`);
        errors++;
      }
    }
  }

  console.log(`\n✅  Passo B concluído: ${updated} subscription(s) atualizadas, ${errors} erro(s).`);
  console.log(`⚠️  ${passoA.length} customer(s) do Passo A permanecem pendentes (dado sujo — decisão manual).`);
}

main()
  .catch((err) => {
    console.error('❌  Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
