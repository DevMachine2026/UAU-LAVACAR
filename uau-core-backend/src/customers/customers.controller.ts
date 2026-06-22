import { Controller, Get, Post, Body, Param, Patch, Put, Query, ForbiddenException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Cadastra um novo cliente (registro público via app mobile)' })
  create(@Body() createDto: CreateCustomerDto) {
    return this.customersService.create(createDto);
  }

  @Patch('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Atualiza nome e/ou telefone do cliente autenticado' })
  updateMyProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.customersService.updateMyProfile(user.id, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Lista clientes com paginação e filtros' })
  findAll(@Query() dto: ListCustomersDto, @CurrentUser() user: User) {
    const unitId = user.role === UserRole.FRANCHISE_OWNER ? user.defaultUnitId : null;
    return this.customersService.findAll(dto, unitId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca um cliente pelo ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    const customer = await this.customersService.findOne(id);
    // [SECURITY] IDOR fix - 2026-06-22
    if (user.role === UserRole.CUSTOMER && customer.userId !== user.id) {
      throw new ForbiddenException('Acesso negado');
    }
    return customer;
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Atualiza os dados ou status de um cliente' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Ativa um cliente' })
  activate(@Param('id') id: string) {
    return this.customersService.activate(id);
  }

  @Patch(':id/block')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Bloqueia um cliente' })
  block(@Param('id') id: string) {
    return this.customersService.block(id);
  }

  @Patch(':id/mark-suspect')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Marca um cliente como suspeito' })
  markSuspect(@Param('id') id: string) {
    return this.customersService.markSuspect(id);
  }
}
