import { BadRequestException } from '@nestjs/common';
import { Prisma, Wallet, WalletMovementOrigin, WalletMovementType } from '@prisma/client';

export type WalletBalanceField = 'balance' | 'promoBalance' | 'blockedBalance';

const BALANCE_FIELDS: WalletBalanceField[] = ['balance', 'promoBalance', 'blockedBalance'];

export function toNumber(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

export function resolveCreditBalanceField(
  origin: WalletMovementOrigin,
  description?: string,
): WalletBalanceField {
  if (origin === WalletMovementOrigin.PARTNER_TRANSACTION) {
    return 'blockedBalance';
  }

  if (origin === WalletMovementOrigin.SUBSCRIPTION) {
    return 'balance';
  }

  if (origin === WalletMovementOrigin.MANUAL_ADJUSTMENT) {
    const normalized = (description ?? '').toUpperCase();
    if (
      normalized.includes('PROMO') ||
      normalized.includes('PROMOCIONAL') ||
      normalized.startsWith('SISTEMA:')
    ) {
      return 'promoBalance';
    }
    if (
      normalized.includes('REFERRAL') ||
      normalized.includes('INDICACAO') ||
      normalized.includes('INDICAÇÃO') ||
      normalized.includes('REDE') ||
      normalized.includes('MMN')
    ) {
      return 'blockedBalance';
    }
    return 'balance';
  }

  return 'balance';
}

export function resolveDebitBalanceOrder(origin: WalletMovementOrigin): WalletBalanceField[] {
  switch (origin) {
    case WalletMovementOrigin.BILLING_DEDUCTION:
      return ['balance', 'promoBalance'];
    case WalletMovementOrigin.PARTNER_TRANSACTION:
      return ['blockedBalance', 'balance', 'promoBalance'];
    case WalletMovementOrigin.CASHBACK_EXPIRY:
      return ['promoBalance', 'balance', 'blockedBalance'];
    default:
      return ['balance', 'promoBalance', 'blockedBalance'];
  }
}

export function resolveExpiryBalanceOrder(origin: WalletMovementOrigin): WalletBalanceField[] {
  if (origin === WalletMovementOrigin.CASHBACK_EXPIRY) {
    return ['promoBalance', 'balance'];
  }
  return ['promoBalance', 'balance', 'blockedBalance'];
}

export function buildWalletIncrementUpdate(
  field: WalletBalanceField,
  delta: number,
): Prisma.WalletUpdateInput {
  return { [field]: { increment: delta } };
}

export function buildWalletDebitUpdate(
  wallet: Wallet,
  amount: number,
  fields: WalletBalanceField[],
): Prisma.WalletUpdateInput {
  let remaining = amount;
  const increments: Partial<Record<WalletBalanceField, number>> = {};

  for (const field of fields) {
    if (remaining <= 0) break;
    const available = toNumber(wallet[field]);
    const deducted = Math.min(available, remaining);
    if (deducted > 0) {
      increments[field] = (increments[field] ?? 0) - deducted;
      remaining -= deducted;
    }
  }

  if (remaining > 0) {
    throw new BadRequestException('Saldo insuficiente na carteira para concluir o débito');
  }

  const update: Prisma.WalletUpdateInput = {};
  for (const field of BALANCE_FIELDS) {
    if (increments[field] !== undefined) {
      update[field] = { increment: increments[field] };
    }
  }
  return update;
}

export function buildBlockedReleaseUpdate(amount: number): Prisma.WalletUpdateInput {
  return {
    blockedBalance: { increment: -amount },
    balance: { increment: amount },
  };
}

export function buildBlockedHoldUpdate(wallet: Wallet, amount: number): Prisma.WalletUpdateInput {
  const available = toNumber(wallet.balance);
  if (available < amount) {
    throw new BadRequestException('Saldo principal insuficiente para bloquear o valor');
  }
  return {
    balance: { increment: -amount },
    blockedBalance: { increment: amount },
  };
}

export function resolveBalanceUpdate(
  wallet: Wallet,
  type: WalletMovementType,
  origin: WalletMovementOrigin,
  amount: number,
  description?: string,
): Prisma.WalletUpdateInput {
  if (amount <= 0) {
    throw new BadRequestException('O valor do movimento deve ser maior que zero');
  }

  switch (type) {
    case WalletMovementType.CREDIT:
      return buildWalletIncrementUpdate(resolveCreditBalanceField(origin, description), amount);

    case WalletMovementType.DEBIT:
      return buildWalletDebitUpdate(wallet, amount, resolveDebitBalanceOrder(origin));

    case WalletMovementType.EXPIRY:
      return buildWalletDebitUpdate(wallet, amount, resolveExpiryBalanceOrder(origin));

    case WalletMovementType.UNBLOCK:
      if (toNumber(wallet.blockedBalance) < amount) {
        throw new BadRequestException('Saldo bloqueado insuficiente para liberação');
      }
      return buildBlockedReleaseUpdate(amount);

    case WalletMovementType.BLOCK:
      return buildBlockedHoldUpdate(wallet, amount);

    default:
      throw new BadRequestException(`Tipo de movimento não suportado: ${type}`);
  }
}
