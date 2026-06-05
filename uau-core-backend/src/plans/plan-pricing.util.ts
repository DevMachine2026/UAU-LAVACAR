import { BadRequestException } from '@nestjs/common';
import { Plan, Prisma, PrismaClient, Vehicle } from '@prisma/client';

type PlanWithSizePrices = Plan & {
  vehicleSizePrices: { sizeCategoryId: string; price: Prisma.Decimal; isActive: boolean }[];
};

type PrismaLike = Pick<PrismaClient, 'vehicleModelSizeRule'>;

export async function resolvePlanAmount(
  prisma: PrismaLike,
  plan: PlanWithSizePrices,
  vehicle?: Pick<Vehicle, 'brand' | 'model' | 'sizeCategoryId'> | null,
): Promise<number> {
  if (!plan.useVehicleSizePricing) {
    return Number(plan.price);
  }

  let sizeCategoryId = vehicle?.sizeCategoryId ?? null;

  if (!sizeCategoryId && vehicle?.brand && vehicle?.model) {
    const rule = await prisma.vehicleModelSizeRule.findFirst({
      where: {
        brand: vehicle.brand,
        model: vehicle.model,
        isActive: true,
      },
    });
    sizeCategoryId = rule?.sizeCategoryId ?? null;
  }

  if (!sizeCategoryId) {
    throw new BadRequestException(
      'Não foi possível determinar o porte do veículo para calcular o preço do plano',
    );
  }

  const sizePrice = plan.vehicleSizePrices.find(
    (entry) => entry.isActive && entry.sizeCategoryId === sizeCategoryId,
  );

  if (!sizePrice) {
    throw new BadRequestException('Preço não configurado para o porte do veículo neste plano');
  }

  return Number(sizePrice.price);
}
