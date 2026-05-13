import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { FranchiseUnitsService } from './franchise-units.service';
import { CreateFranchiseUnitDto } from './dto/create-franchise-unit.dto';
import { UpdateFranchiseUnitDto } from './dto/update-franchise-unit.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

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
  update(@Param('id') id: string, @Body() updateDto: UpdateFranchiseUnitDto) {
    return this.unitsService.update(id, updateDto);
  }
}
