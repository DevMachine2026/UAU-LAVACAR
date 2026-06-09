/**
 * Script de migração: banco antigo (uau-clube-api / Render PostgreSQL) → novo banco (Neon)
 *
 * O que é migrado:
 *   ✓ Users (ADMIN → SUPER_ADMIN, USER → CUSTOMER, MANAGER → FRANCHISE_OWNER)
 *   ✓ Customers (criado para cada USER/MANAGER)
 *   ✓ Wallets (criada para cada Customer)
 *   ✓ Vehicles (Cars do sistema antigo)
 *   ✓ Plans (simplificado — sem features de availability)
 *   ✓ Subscriptions
 *   ✓ BillingHistory (Payments do sistema antigo)
 *
 * O que NÃO é migrado:
 *   ✗ WashLocations → FranchiseUnits (requer State/City preexistentes — configure manualmente)
 *   ✗ Logs, Coupons, IndividualServicePurchase, Notifications
 *
 * Uso:
 *   OLD_DB_URL="postgresql://user:pass@host/db?sslmode=require" \
 *   DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require" \
 *   DIRECT_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require" \
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-from-old-db.ts
 *
 * ATENÇÃO: Rode em modo DRY_RUN=true primeiro para verificar sem gravar.
 *   DRY_RUN=true OLD_DB_URL="..." DATABASE_URL="..." DIRECT_URL="..." npx ts-node ...
 */

import { Client as PgClient } from 'pg';
import { PrismaClient, UserRole, UserStatus, SubscriptionStatus, BillingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

const DRY_RUN = process.env.DRY_RUN === 'true';

const oldDb = new PgClient({
  connectionString: process.env.OLD_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient();

const genId = (): string => randomUUID().replace(/-/g, '');

// ─── Helpers ───────────────────────────────────────────────────────────────

function mapRole(oldRole: string): UserRole {
  if (oldRole === 'ADMIN') return UserRole.SUPER_ADMIN;
  if (oldRole === 'MANAGER') return UserRole.FRANCHISE_OWNER;
  return UserRole.CUSTOMER;
}

function mapUserStatus(oldStatus: string): UserStatus {
  return oldStatus === 'ACTIVE' ? UserStatus.ACTIVE : UserStatus.INACTIVE;
}

function mapSubscriptionStatus(isActive: boolean, endDate: Date | null): SubscriptionStatus {
  if (!isActive) return SubscriptionStatus.CANCELLED;
  if (endDate && endDate < new Date()) return SubscriptionStatus.CANCELLED;
  return SubscriptionStatus.ACTIVE;
}

function mapPaymentStatus(oldStatus: string): BillingStatus {
  if (oldStatus === 'PAID') return BillingStatus.PAID;
  if (oldStatus === 'CANCELED') return BillingStatus.CANCELLED;
  return BillingStatus.PENDING;
}

function log(icon: string, msg: string) {
  console.log(`  ${icon} ${msg}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.OLD_DB_URL) {
    console.error('❌  OLD_DB_URL não definida. Abortando.');
    process.exit(1);
  }

  await oldDb.connect();
  console.log('✓ Conectado ao banco antigo (Render)');
  console.log(DRY_RUN ? '⚠️  DRY_RUN=true — nada será gravado no Neon\n' : '🚀  Modo de escrita ativo\n');

  // ID maps: old Int id → new String cuid
  const userIdMap = new Map<number, string>();
  const customerIdMap = new Map<number, string>();
  const planIdMap = new Map<number, string>();
  const vehicleIdMap = new Map<number, string>();

  let statsUsers = 0, statsCustomers = 0, statsVehicles = 0;
  let statsPlans = 0, statsSubs = 0, statsBilling = 0;

  // ── 1. Users ─────────────────────────────────────────────────────────────

  console.log('─── 1/6 Migrando Users ───');
  const { rows: oldUsers } = await oldDb.query<{
    id: number; name: string; email: string; password: string;
    phone: string; cpf: string | null; role: string;
    createdAt: Date; updatedAt: Date; status: string;
  }>(`
    SELECT id, name, email, password, phone, cpf, role, "createdAt", "updatedAt", status
    FROM public."User"
    WHERE "deletedAt" IS NULL
    ORDER BY id
  `);

  for (const u of oldUsers) {
    const newId = genId();
    userIdMap.set(u.id, newId);

    if (!DRY_RUN) {
      try {
        await prisma.user.create({
          data: {
            id: newId,
            name: u.name,
            email: u.email.toLowerCase().trim(),
            passwordHash: u.password,
            role: mapRole(u.role),
            status: mapUserStatus(u.status),
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
          },
        });
        statsUsers++;

        // Customer + Wallet para USERs e MANAGERs
        if (u.role === 'USER' || u.role === 'MANAGER') {
          const customerId = genId();
          customerIdMap.set(u.id, customerId);

          await prisma.customer.create({
            data: {
              id: customerId,
              userId: newId,
              cpf: u.cpf ?? null,
              phone: u.phone ?? null,
            },
          });
          statsCustomers++;

          await prisma.wallet.create({
            data: { id: genId(), customerId, balance: 0, promoBalance: 0, blockedBalance: 0 },
          });
        }

        log('✓', `${u.email} (${u.role} → ${mapRole(u.role)})`);
      } catch (err: any) {
        if (err.code === 'P2002') {
          log('⚠', `${u.email}: e-mail duplicado, pulando`);
        } else {
          log('✗', `${u.email}: ${err.message}`);
        }
      }
    } else {
      log('~', `[DRY] ${u.email} (${u.role} → ${mapRole(u.role)})`);
      statsUsers++;
      if (u.role === 'USER' || u.role === 'MANAGER') {
        customerIdMap.set(u.id, genId());
        statsCustomers++;
      }
    }
  }

  // ── 2. Vehicles (Cars) ───────────────────────────────────────────────────

  console.log('\n─── 2/6 Migrando Vehicles ───');
  const { rows: oldCars } = await oldDb.query<{
    id: number; model: string; plate: string; userId: number;
    brand: string; year: number;
  }>(`
    SELECT id, model, plate, "userId", brand, year
    FROM public."Car"
    WHERE "deletedAt" IS NULL
    ORDER BY id
  `);

  for (const car of oldCars) {
    const customerId = customerIdMap.get(car.userId);
    if (!customerId) {
      log('⚠', `Car ${car.plate}: userId=${car.userId} sem Customer (provavelmente ADMIN), pulando`);
      continue;
    }

    const newId = genId();
    vehicleIdMap.set(car.id, newId);

    if (!DRY_RUN) {
      try {
        await prisma.vehicle.create({
          data: {
            id: newId,
            customerId,
            plate: car.plate.toUpperCase().replace(/\s/g, ''),
            brand: car.brand,
            model: car.model,
            year: car.year ?? null,
            isActive: true,
          },
        });
        statsVehicles++;
        log('✓', `${car.plate}`);
      } catch (err: any) {
        if (err.code === 'P2002') {
          log('⚠', `${car.plate}: placa duplicada, pulando`);
        } else {
          log('✗', `${car.plate}: ${err.message}`);
        }
      }
    } else {
      log('~', `[DRY] ${car.plate}`);
      statsVehicles++;
    }
  }

  // ── 3. Plans ──────────────────────────────────────────────────────────────

  console.log('\n─── 3/6 Migrando Plans ───');
  const { rows: oldPlans } = await oldDb.query<{
    id: number; name: string; price: number; description: string | null;
    createdAt: Date; updatedAt: Date;
  }>(`
    SELECT id, name, price, description, "createdAt", "updatedAt"
    FROM public."Plan"
    ORDER BY id
  `);

  for (const plan of oldPlans) {
    const newId = genId();
    planIdMap.set(plan.id, newId);

    if (!DRY_RUN) {
      try {
        await prisma.plan.create({
          data: {
            id: newId,
            name: plan.name,
            description: plan.description ?? null,
            price: plan.price,
            coverageType: 'UNIT',
            allowAllDays: true,
            maxVehicles: 1,
            isActive: true,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          },
        });
        statsPlans++;
        log('✓', `${plan.name} (R$${plan.price})`);
      } catch (err: any) {
        log('✗', `Plan "${plan.name}": ${err.message}`);
      }
    } else {
      log('~', `[DRY] ${plan.name}`);
      statsPlans++;
    }
  }

  // ── 4. Subscriptions ──────────────────────────────────────────────────────

  console.log('\n─── 4/6 Migrando Subscriptions ───');
  const { rows: oldSubs } = await oldDb.query<{
    id: number; userId: number; planId: number | null; isActive: boolean;
    startDate: Date; expiresAt: Date | null; endDate: Date | null;
    subscriptionIdAsaas: string | null; createdAt: Date; updatedAt: Date;
  }>(`
    SELECT id, "userId", "planId", "isActive", "startDate", "expiresAt",
           "endDate", "subscriptionIdAsaas", "createdAt", "updatedAt"
    FROM public."Subscription"
    ORDER BY id
  `);

  for (const sub of oldSubs) {
    const customerId = customerIdMap.get(sub.userId);
    const planId = sub.planId ? planIdMap.get(sub.planId) : null;

    if (!customerId) {
      log('⚠', `Sub ${sub.id}: userId=${sub.userId} sem Customer, pulando`);
      continue;
    }
    if (!planId) {
      log('⚠', `Sub ${sub.id}: planId=${sub.planId} não encontrado, pulando`);
      continue;
    }

    if (!DRY_RUN) {
      try {
        await prisma.subscription.create({
          data: {
            id: genId(),
            customerId,
            planId,
            status: mapSubscriptionStatus(sub.isActive, sub.endDate),
            asaasId: sub.subscriptionIdAsaas ?? null,
            startedAt: sub.startDate ?? null,
            expiresAt: sub.expiresAt ?? null,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
          },
        });
        statsSubs++;
        log('✓', `Sub ${sub.id} → customer ${customerId}`);
      } catch (err: any) {
        log('✗', `Sub ${sub.id}: ${err.message}`);
      }
    } else {
      log('~', `[DRY] Sub ${sub.id}`);
      statsSubs++;
    }
  }

  // ── 5. BillingHistory (Payments) ─────────────────────────────────────────

  console.log('\n─── 5/6 Migrando BillingHistory (Payments) ───');
  const { rows: oldPayments } = await oldDb.query<{
    id: number; userId: number; amount: number; paymentDate: Date;
    status: string; planId: number | null; pixPayload: string | null;
    pixQrCode: string | null; createdAt: Date; updatedAt: Date;
  }>(`
    SELECT id, "userId", amount, "paymentDate", status, "planId",
           "pixPayload", "pixQrCode", "createdAt", "updatedAt"
    FROM public."Payment"
    ORDER BY id
  `);

  for (const p of oldPayments) {
    const customerId = customerIdMap.get(p.userId);
    if (!customerId) {
      log('⚠', `Payment ${p.id}: userId=${p.userId} sem Customer, pulando`);
      continue;
    }

    if (!DRY_RUN) {
      try {
        await prisma.billingHistory.create({
          data: {
            id: genId(),
            customerId,
            amount: p.amount,
            status: mapPaymentStatus(p.status),
            dueDate: p.paymentDate,
            paidAt: p.status === 'PAID' ? p.paymentDate : null,
            pixCopyPaste: p.pixPayload ?? null,
            pixQrCode: p.pixQrCode ?? null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          },
        });
        statsBilling++;
        log('✓', `Payment ${p.id} (${p.status})`);
      } catch (err: any) {
        log('✗', `Payment ${p.id}: ${err.message}`);
      }
    } else {
      log('~', `[DRY] Payment ${p.id}`);
      statsBilling++;
    }
  }

  // ── 6. Resumo ─────────────────────────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════');
  console.log(DRY_RUN ? '  DRY RUN — nenhum dado foi gravado' : '  MIGRAÇÃO CONCLUÍDA');
  console.log('═══════════════════════════════════════════');
  console.log(`  Users:          ${statsUsers}`);
  console.log(`  Customers:      ${statsCustomers}`);
  console.log(`  Vehicles:       ${statsVehicles}`);
  console.log(`  Plans:          ${statsPlans}`);
  console.log(`  Subscriptions:  ${statsSubs}`);
  console.log(`  BillingHistory: ${statsBilling}`);
  console.log('═══════════════════════════════════════════');

  console.log('\n⚠️  WashLocations → FranchiseUnits NÃO foram migradas.');
  console.log('   Configure as unidades franqueadas manualmente pelo painel Admin.\n');
}

main()
  .catch((err) => {
    console.error('\n❌  Erro fatal:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await oldDb.end().catch(() => {});
    await prisma.$disconnect().catch(() => {});
  });
