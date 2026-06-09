import { Controller, Get, Post, Body, Param, Patch, Put } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
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
}
