import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { ListBillingDto } from './dto/list-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria um novo registro de cobrança' })
  create(@Body() createDto: CreateBillingDto) {
    return this.billingService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista histórico de cobranças com paginação e filtros' })
  findAll(@Query() dto: ListBillingDto) {
    return this.billingService.findAll(dto);
  }

  @Get('my-current')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cobrança pendente atual do cliente autenticado (mobile)' })
  findMyCurrent(@CurrentUser() user: User) {
    return this.billingService.findCurrentByUserId(user.id);
  }

  @Get('my-history')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Histórico de cobranças do cliente autenticado (mobile)' })
  findMyHistory(@CurrentUser() user: User) {
    return this.billingService.findByCustomer(user.id);
  }

  @Get('customer-history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiQuery({ name: 'userId', required: true })
  @ApiOperation({ summary: 'Histórico de cobranças por userId (admin)' })
  findByCustomer(@Query('userId') userId: string) {
    return this.billingService.findByCustomer(userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca uma cobrança pelo ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.billingService.findOne(id, user);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza o status de uma cobrança' })
  update(@Param('id') id: string, @Body() updateDto: UpdateBillingDto) {
    return this.billingService.update(id, updateDto);
  }
}
