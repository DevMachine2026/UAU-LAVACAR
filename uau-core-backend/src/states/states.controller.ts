import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { StatesService } from './states.service';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('states')
@ApiBearerAuth()
@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os estados' })
  findAll() {
    return this.statesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um estado pelo ID' })
  findOne(@Param('id') id: string) {
    return this.statesService.findOne(id);
  }

  @Get(':stateId/cities')
  @ApiOperation({ summary: 'Lista as cidades de um estado' })
  findCitiesByState(@Param('stateId') stateId: string) {
    return this.statesService.findCitiesByState(stateId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria um estado' })
  create(@Body() dto: CreateStateDto) {
    return this.statesService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza um estado' })
  update(@Param('id') id: string, @Body() dto: UpdateStateDto) {
    return this.statesService.update(id, dto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ativa um estado' })
  activate(@Param('id') id: string) {
    return this.statesService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desativa um estado' })
  deactivate(@Param('id') id: string) {
    return this.statesService.deactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um estado' })
  remove(@Param('id') id: string) {
    return this.statesService.remove(id);
  }
}
