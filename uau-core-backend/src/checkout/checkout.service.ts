import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { calculateCashbackUsage } from './checkout-cashback.util';
import { SubscriptionCheckoutDto } from './dto/subscription-checkout.dto';
import { resolvePlanAmount } from '../plans/plan-pricing.util';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly walletService: WalletService,
  ) {}

  async previewSubscription(user: User, dto: SubscriptionCheckoutDto) {
    const context = await this.loadCheckoutContext(user, dto);
    const pricing = calculateCashbackUsage(
      context.planAmount,
      context.balance,
      context.promoBalance,
    );

    return {
      ...pricing,
      paymentMethod: dto.paymentMethod,
      planId: dto.planId,
      vehicleId: dto.vehicleId,
      unitId: dto.unitId,
    };
  }

  async confirmSubscription(user: User, dto: SubscriptionCheckoutDto) {
    const context = await this.loadCheckoutContext(user, dto);
    const pricing = calculateCashbackUsage(
      context.planAmount,
      context.balance,
      context.promoBalance,
    );

    if (pricing.gatewayAmount <= 0 && dto.paymentMethod !== 'PIX') {
      throw new BadRequestException(
        'Quando o cashback cobre o valor integral, utilize PIX como forma de pagamento',
      );
    }

    const firstChargeAmount =
      pricing.gatewayAmount > 0 ? pricing.gatewayAmount : 0.01;

    const subscriptionResult = await this.subscriptionsService.create({
      customerId: context.customer.id,
      planId: dto.planId,
      paymentMethodId: dto.paymentMethod,
      vehicleId: dto.vehicleId,
      recurringAmount: context.planAmount,
      firstChargeAmount,
    });

    if (pricing.totalCashbackUsed > 0 && context.wallet) {
      await this.walletService.applyCashbackUsage(
        context.wallet.id,
        pricing.promotionalCashbackUsed,
        pricing.realCashbackUsed,
        subscriptionResult.billing.id,
      );
    }

    return this.mapConfirmResponse(subscriptionResult, dto, pricing);
  }

  private mapConfirmResponse(
    result: Awaited<ReturnType<SubscriptionsService['create']>>,
    dto: SubscriptionCheckoutDto,
    pricing: ReturnType<typeof calculateCashbackUsage>,
  ) {
    const { subscription, billing, payment } = result;

    return {
      subscriptionId: subscription.id,
      billingCycleId: billing.id,
      paymentMethod: dto.paymentMethod,
      asaasPaymentId: payment.asaasPaymentId,
      invoiceUrl: payment.invoiceUrl,
      pixQrCode: payment.pixQrCode,
      pixCopyPaste: payment.pixCopyPaste,
      dueDate: payment.dueDate,
      value: payment.value,
      planAmount: pricing.planAmount,
      gatewayAmount: pricing.gatewayAmount,
      promotionalCashbackUsed: pricing.promotionalCashbackUsed,
      realCashbackUsed: pricing.realCashbackUsed,
      totalCashbackUsed: pricing.totalCashbackUsed,
      billingCycle: {
        id: billing.id,
        status: billing.status,
        gatewayAmount: pricing.gatewayAmount,
        pixQrCode: payment.pixQrCode,
        pixCopyPaste: payment.pixCopyPaste,
        invoiceUrl: payment.invoiceUrl,
        asaasPayment: {
          id: payment.asaasPaymentId,
          invoiceUrl: payment.invoiceUrl,
          pixQrCode: payment.pixQrCode,
          pixCopyPaste: payment.pixCopyPaste,
        },
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
      },
    };
  }

  private async loadCheckoutContext(user: User, dto: SubscriptionCheckoutDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.id },
      include: { wallet: true },
    });

    if (!customer) {
      throw new NotFoundException('Perfil de cliente não encontrado para este usuário');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, customerId: customer.id, isActive: true },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado para este cliente');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
      include: {
        availabilities: { where: { isActive: true } },
        vehicleSizePrices: { where: { isActive: true } },
      },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plano não encontrado ou inativo');
    }

    this.assertPlanAvailability(plan.availabilities, dto);

    const planAmount = await resolvePlanAmount(this.prisma, plan, vehicle);
    const balance = Number(customer.wallet?.balance ?? 0);
    const promoBalance = Number(customer.wallet?.promoBalance ?? 0);

    return {
      customer,
      vehicle,
      plan,
      planAmount,
      balance,
      promoBalance,
      wallet: customer.wallet,
    };
  }

  private assertPlanAvailability(
    availabilities: { stateId: string | null; cityId: string | null; unitId: string | null }[],
    dto: SubscriptionCheckoutDto,
  ) {
    if (availabilities.length === 0) {
      return;
    }

    const matches = availabilities.some((entry) => {
      if (dto.unitId && entry.unitId && entry.unitId !== dto.unitId) return false;
      if (dto.cityId && entry.cityId && entry.cityId !== dto.cityId) return false;
      if (dto.stateId && entry.stateId && entry.stateId !== dto.stateId) return false;
      return true;
    });

    if (!matches) {
      throw new BadRequestException('Plano indisponível para a localização selecionada');
    }
  }
}
