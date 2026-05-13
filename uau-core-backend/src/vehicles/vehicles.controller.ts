import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cadastra um novo veículo' })
  create(@Body() createDto: CreateVehicleDto) {
    return this.vehiclesService.create(createDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Lista todos os veículos' })
  findAll() {
    return this.vehiclesService.findAll();
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
}
