import { Controller, Get, Post, Body, Param, Put, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
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
  @ApiOperation({ summary: 'Lista todo o histórico de cobranças' })
  findAll() {
    return this.billingService.findAll();
  }

  @Get('my-history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiQuery({ name: 'userId', required: true })
  @ApiOperation({ summary: 'Histórico de cobranças de um cliente' })
  findByCustomer(@Query('userId') userId: string) {
    return this.billingService.findByCustomer(userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca uma cobrança pelo ID' })
  findOne(@Param('id') id: string) {
    return this.billingService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza o status de uma cobrança' })
  update(@Param('id') id: string, @Body() updateDto: UpdateBillingDto) {
    return this.billingService.update(id, updateDto);
  }
}
