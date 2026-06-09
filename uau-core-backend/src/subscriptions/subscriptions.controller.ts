import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cria uma nova assinatura (Checkout)' })
  create(@Body() createDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista todas as assinaturas' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca uma assinatura pelo ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.subscriptionsService.findOne(id, user);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza o status de uma assinatura' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateDto);
  }
}
