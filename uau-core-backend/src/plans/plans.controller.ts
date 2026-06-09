import { Controller, Get, Post, Body, Param, Patch, Put, Delete } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateVehicleSizePriceDto } from './dto/create-vehicle-size-price.dto';
import { UpdateVehicleSizePriceDto } from './dto/update-vehicle-size-price.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria um novo plano de assinatura' })
  create(@Body() createDto: CreatePlanDto) {
    return this.plansService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os planos' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um plano pelo ID' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza um plano' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePlanDto) {
    return this.plansService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ativa um plano' })
  activate(@Param('id') id: string) {
    return this.plansService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desativa um plano' })
  deactivate(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }

  // ─── Vehicle Size Prices ──────────────────────────────────────────────────

  @Get(':planId/vehicle-size-prices')
  @ApiOperation({ summary: 'Lista preços por porte de veículo de um plano' })
  findVehicleSizePrices(@Param('planId') planId: string) {
    return this.plansService.findVehicleSizePrices(planId);
  }

  @Post(':planId/vehicle-size-prices')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria preço por porte de veículo para um plano' })
  createVehicleSizePrice(
    @Param('planId') planId: string,
    @Body() dto: CreateVehicleSizePriceDto,
  ) {
    return this.plansService.createVehicleSizePrice(planId, dto);
  }

  @Put(':planId/vehicle-size-prices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Substitui preço por porte de veículo' })
  updateVehicleSizePrice(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleSizePriceDto,
  ) {
    return this.plansService.updateVehicleSizePrice(planId, id, dto);
  }

  @Patch(':planId/vehicle-size-prices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza parcialmente preço por porte de veículo' })
  patchVehicleSizePrice(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleSizePriceDto,
  ) {
    return this.plansService.updateVehicleSizePrice(planId, id, dto);
  }

  @Delete(':planId/vehicle-size-prices/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove preço por porte de veículo' })
  removeVehicleSizePrice(
    @Param('planId') planId: string,
    @Param('id') id: string,
  ) {
    return this.plansService.removeVehicleSizePrice(planId, id);
  }
}
