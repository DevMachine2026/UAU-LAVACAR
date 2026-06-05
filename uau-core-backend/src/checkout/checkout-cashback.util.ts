export interface CashbackBreakdown {
  planAmount: number;
  baseAmount: number;
  promotionalCashbackUsed: number;
  realCashbackUsed: number;
  totalCashbackUsed: number;
  cashbackUsed: number;
  gatewayAmount: number;
}

export function calculateCashbackUsage(
  planAmount: number,
  balance: number,
  promoBalance: number,
): CashbackBreakdown {
  const safeBalance = Math.max(balance, 0);
  const safePromo = Math.max(promoBalance, 0);

  let promotionalCashbackUsed = 0;
  let realCashbackUsed = 0;

  if (safePromo > 0 && safeBalance > 0) {
    const half = planAmount / 2;
    promotionalCashbackUsed = Math.min(safePromo, half);
    realCashbackUsed = Math.min(safeBalance, half);

    let remaining = planAmount - promotionalCashbackUsed - realCashbackUsed;
    if (remaining > 0) {
      const extraPromo = Math.min(safePromo - promotionalCashbackUsed, remaining);
      promotionalCashbackUsed += extraPromo;
      remaining -= extraPromo;
    }
    if (remaining > 0) {
      realCashbackUsed += Math.min(safeBalance - realCashbackUsed, remaining);
    }
  } else {
    promotionalCashbackUsed = Math.min(safePromo, planAmount);
    realCashbackUsed = Math.min(safeBalance, planAmount - promotionalCashbackUsed);
  }

  const totalCashbackUsed = promotionalCashbackUsed + realCashbackUsed;
  const gatewayAmount = Math.max(planAmount - totalCashbackUsed, 0);

  return {
    planAmount,
    baseAmount: planAmount,
    promotionalCashbackUsed,
    realCashbackUsed,
    totalCashbackUsed,
    cashbackUsed: totalCashbackUsed,
    gatewayAmount,
  };
}
