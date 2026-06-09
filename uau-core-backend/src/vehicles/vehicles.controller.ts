import { Controller, Get, Post, Body, Param, Put, Patch } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cadastra um novo veículo' })
  create(@Body() createDto: CreateVehicleDto, @CurrentUser() user: User) {
    return this.vehiclesService.create(createDto, user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Lista veículos (todos para staff; apenas do cliente para CUSTOMER)' })
  findAll(@CurrentUser() user: User) {
    return this.vehiclesService.findAll(user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Busca um veículo pelo ID' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Atualiza os dados de um veículo' })
  update(@Param('id') id: string, @Body() updateDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Ativa um veículo (mobile)' })
  activate(@Param('id') id: string) {
    return this.vehiclesService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Desativa um veículo (mobile)' })
  deactivate(@Param('id') id: string) {
    return this.vehiclesService.deactivate(id);
  }

  @Patch(':id/set-primary')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Define veículo como principal do cliente (mobile)' })
  setPrimary(@Param('id') id: string) {
    return this.vehiclesService.setPrimary(id);
  }
}
