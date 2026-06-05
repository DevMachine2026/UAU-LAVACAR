import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CheckoutService } from './checkout.service';
import { SubscriptionCheckoutDto } from './dto/subscription-checkout.dto';

@ApiTags('checkout')
@ApiBearerAuth()
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('subscription/preview')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Preview do checkout de assinatura (mobile)' })
  previewSubscription(
    @CurrentUser() user: User,
    @Body() dto: SubscriptionCheckoutDto,
  ) {
    return this.checkoutService.previewSubscription(user, dto);
  }

  @Post('subscription/confirm')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Confirma assinatura e gera cobrança Asaas (mobile)' })
  confirmSubscription(
    @CurrentUser() user: User,
    @Body() dto: SubscriptionCheckoutDto,
  ) {
    return this.checkoutService.confirmSubscription(user, dto);
  }
}
