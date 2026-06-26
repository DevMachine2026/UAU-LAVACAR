import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FranchiseUnitsService } from './franchise-units.service';
import { CreateFranchiseUnitDto } from './dto/create-franchise-unit.dto';
import { UpdateFranchiseUnitDto } from './dto/update-franchise-unit.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { UpsertWorkingHoursDto } from './dto/upsert-working-hours.dto';
import { AddUnitStaffDto } from './dto/add-unit-staff.dto';

@ApiTags('franchise-units')
@ApiBearerAuth()
@Controller('franchise-units')
export class FranchiseUnitsController {
  constructor(private readonly unitsService: FranchiseUnitsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria uma nova unidade' })
  create(@Body() createDto: CreateFranchiseUnitDto) {
    return this.unitsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as unidades' })
  findAll() {
    return this.unitsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma unidade pelo ID' })
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Atualiza uma unidade' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFranchiseUnitDto, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.update(id, updateDto, actorId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ativa uma unidade franqueada' })
  activate(@Param('id') id: string) {
    return this.unitsService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desativa uma unidade franqueada' })
  deactivate(@Param('id') id: string) {
    return this.unitsService.deactivate(id);
  }

  @Patch(':id/equipment/:equipmentId')
  @Roles(UserRole.OPERATOR, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza o status de um equipamento da unidade' })
  updateEquipmentStatus(
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: UpdateEquipmentStatusDto,
    @CurrentUser() user: User,
  ) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.updateEquipmentStatus(id, equipmentId, dto, actorId);
  }

  @Put(':id/working-hours')
  @Roles(UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Configura os horários de funcionamento da unidade (bulk upsert)' })
  upsertWorkingHours(@Param('id') id: string, @Body() dto: UpsertWorkingHoursDto, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.upsertWorkingHours(id, dto, actorId);
  }

  @Get(':id/staff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Lista a equipe de uma unidade' })
  getStaff(@Param('id') id: string, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.getStaff(id, actorId);
  }

  @Post(':id/staff')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Vincula um usuário como staff da unidade' })
  addStaff(@Param('id') id: string, @Body() dto: AddUnitStaffDto, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.addStaff(id, dto, actorId);
  }

  @Patch(':id/staff/:staffId/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Ativa um vínculo de staff' })
  activateStaff(@Param('id') id: string, @Param('staffId') staffId: string, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.activateStaff(id, staffId, actorId);
  }

  @Patch(':id/staff/:staffId/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER)
  @ApiOperation({ summary: 'Desativa um vínculo de staff' })
  deactivateStaff(@Param('id') id: string, @Param('staffId') staffId: string, @CurrentUser() user: User) {
    const actorId = user.role === UserRole.FRANCHISE_OWNER ? user.id : undefined;
    return this.unitsService.deactivateStaff(id, staffId, actorId);
  }
}
