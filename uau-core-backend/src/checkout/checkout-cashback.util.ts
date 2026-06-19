// Usado exclusivamente no checkout de assinatura. Nunca chamar para serviços avulsos.
export interface CashbackBreakdown {
  planAmount: number;
  baseAmount: number;
  welcomeBonusUsed: number;
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
  welcomeBonusBalance = 0,
): CashbackBreakdown {
  const safeBalance = Math.max(balance, 0);
  const safePromo = Math.max(promoBalance, 0);
  const safeWelcome = Math.max(welcomeBonusBalance, 0);

  // Bônus de boas-vindas tem prioridade máxima
  const welcomeBonusUsed = Math.min(safeWelcome, planAmount);
  const remaining = planAmount - welcomeBonusUsed;

  // Lógica proporcional 50/50 original sobre o valor remanescente
  let promotionalCashbackUsed = 0;
  let realCashbackUsed = 0;

  if (safePromo > 0 && safeBalance > 0) {
    const half = remaining / 2;
    promotionalCashbackUsed = Math.min(safePromo, half);
    realCashbackUsed = Math.min(safeBalance, half);

    let leftover = remaining - promotionalCashbackUsed - realCashbackUsed;
    if (leftover > 0) {
      const extraPromo = Math.min(safePromo - promotionalCashbackUsed, leftover);
      promotionalCashbackUsed += extraPromo;
      leftover -= extraPromo;
    }
    if (leftover > 0) {
      realCashbackUsed += Math.min(safeBalance - realCashbackUsed, leftover);
    }
  } else {
    promotionalCashbackUsed = Math.min(safePromo, remaining);
    realCashbackUsed = Math.min(safeBalance, remaining - promotionalCashbackUsed);
  }

  const totalCashbackUsed = welcomeBonusUsed + promotionalCashbackUsed + realCashbackUsed;
  const gatewayAmount = Math.max(planAmount - totalCashbackUsed, 0);

  return {
    planAmount,
    baseAmount: planAmount,
    welcomeBonusUsed,
    promotionalCashbackUsed,
    realCashbackUsed,
    totalCashbackUsed,
    cashbackUsed: totalCashbackUsed,
    gatewayAmount,
  };
}
